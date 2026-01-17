import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import {
  parseDocx,
  createPdfGenerator,
  startServer,
  stopServer,
  logger,
} from 'digimaker-cli';

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
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
app.post('/api/convert', upload.array('files', 50), async (req, res) => {
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

    // Parse all docx files
    logger.info('Parsing docx files...');
    const parsedLessons = await Promise.all(
      filePaths.map(async (file) => {
        const result = await parseDocx(file.path);
        return {
          data: result.data,
          name: file.name,
        };
      })
    );

    // Start the template server
    logger.info('Starting template server...');
    const server = await startServer();

    try {
      // Create PDF generator
      const generator = await createPdfGenerator(server.url);

      // Generate all PDFs
      logger.info('Generating PDFs...');
      const pdfPaths = await generator.generateBatch(
        parsedLessons.map((lesson) => ({
          data: lesson.data,
          options: {
            outputDir,
            filename: lesson.name,
          },
        }))
      );

      await generator.close();

      // If single file, return PDF directly
      if (pdfPaths.length === 1) {
        const pdfBuffer = await fs.readFile(pdfPaths[0]);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${parsedLessons[0].name}.pdf"`
        );
        res.send(pdfBuffer);
        return;
      }

      // Multiple files - create zip
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="lessons.zip"'
      );

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(res);

      for (const pdfPath of pdfPaths) {
        const filename = path.basename(pdfPath);
        archive.file(pdfPath, { name: filename });
      }

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
});

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
