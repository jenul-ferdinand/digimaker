import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import {
  createPdfGenerator,
  convertWithConcurrency,
  startServer,
  stopServer,
  logger,
  POOL_SIZE,
} from '@digimakers/core';

const app = express();
const PORT = process.env.PORT || 3000;
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '', 10) || POOL_SIZE;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only .docx files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Convert docx files to PDFs
app.post(
  '/api/convert',
  upload.array('files', 50) as unknown as express.RequestHandler,
  async (req, res) => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    logger.info(`Received ${files.length} file(s) for conversion`);

    // Create temp directory for this request
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'digimaker-'));
    const inputDir = path.join(tempDir, 'input');
    const outputDir = path.join(tempDir, 'output');
    await fs.mkdir(inputDir);
    await fs.mkdir(outputDir);

    try {
      // Save uploaded files to temp directory
      const filePaths: { path: string; name: string }[] = [];
      for (const file of files) {
        const filePath = path.join(inputDir, file.originalname);
        await fs.writeFile(filePath, file.buffer);
        filePaths.push({
          path: filePath,
          name: file.originalname.replace('.docx', ''),
        });
      }

      // Start the template server
      logger.info('Starting template server...');
      const server = await startServer();

      try {
        // Create PDF generator
        const generator = await createPdfGenerator(server.url);

        // Convert files with bounded concurrency
        logger.info(`Converting ${filePaths.length} file(s) with concurrency ${CONCURRENCY}...`);
        const results = await convertWithConcurrency(filePaths, generator, outputDir, CONCURRENCY);

        await generator.close();

        const succeeded = results.filter((r) => r.success);
        const failed = results.filter((r) => !r.success);

        logger.info(`Conversion complete: ${succeeded.length} succeeded, ${failed.length} failed`);

        // If all failed, return error
        if (succeeded.length === 0) {
          res.status(500).json({
            error: 'All conversions failed',
            failures: failed.map((f) => ({ file: f.file, error: f.error })),
          });
          return;
        }

        // If single file succeeded and no failures, return PDF directly
        if (succeeded.length === 1 && failed.length === 0) {
          const pdfBuffer = await fs.readFile(succeeded[0].pdfPath!);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${succeeded[0].file}.pdf"`);
          res.send(pdfBuffer);
          return;
        }

        // Multiple files or partial failure - create zip with manifest
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="lessons.zip"');

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        // Add successful PDFs
        for (const result of succeeded) {
          const filename = path.basename(result.pdfPath!);
          archive.file(result.pdfPath!, { name: filename });
        }

        // Add manifest with conversion results
        const manifest = {
          total: results.length,
          succeeded: succeeded.length,
          failed: failed.length,
          results: results.map((r) => ({
            file: r.file,
            success: r.success,
            ...(r.error && { error: r.error }),
          })),
        };
        archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

        await archive.finalize();
      } finally {
        await stopServer(server);
      }
    } catch (error) {
      logger.error({ err: error }, 'Conversion failed');
      res.status(500).json({
        error: 'Conversion failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      // Cleanup temp directory
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
);

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
