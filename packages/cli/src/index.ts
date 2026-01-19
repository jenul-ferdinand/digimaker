#!/usr/bin/env node
import 'dotenv/config';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import {
  startServer,
  stopServer,
  createPdfGenerator,
  findDocxFiles,
  parseDocx,
  sampleLessonData,
  logger,
} from '@digimakers/core';

const OUTPUT_DIR = path.resolve(process.cwd(), 'output');

async function main() {
  await yargs(hideBin(process.argv))
    .scriptName('digimaker')
    .usage('$0 <command> [options]')
    .command(
      'convert [path]',
      'Convert .docx files to PDF',
      (yargs) =>
        yargs
          .positional('path', {
            type: 'string',
            default: '.',
            description: 'Path to .docx file or directory',
          })
          .option('output', {
            alias: 'o',
            type: 'string',
            default: OUTPUT_DIR,
            description: 'Output directory for PDFs',
          })
          .option('recursive', {
            alias: 'r',
            type: 'boolean',
            default: false,
            description: 'Recursively search directories',
          }),
      async (argv) => {
        const targetPath = path.resolve(argv.path);
        const files = await findDocxFiles(targetPath, { recursive: argv.recursive });

        if (files.length === 0) {
          logger.warn('No .docx files found');
          return;
        }

        logger.info(`Converting ${files.length} file(s)...`);

        const server = await startServer();

        try {
          const generator = await createPdfGenerator(server.url);

          const items = await Promise.all(
            files.map(async (file) => {
              const result = await parseDocx(file.path);
              return {
                data: result.data,
                options: { outputDir: argv.output, filename: file.name },
              };
            })
          );

          await generator.generateBatch(items);
          await generator.close();

          logger.info(`Done! ${files.length} PDF(s) saved to ${argv.output}`);
        } finally {
          await stopServer(server);
        }
      }
    )
    .command(
      'generate',
      'Generate a PDF from sample data (for testing)',
      (yargs) =>
        yargs
          .option('output', {
            alias: 'o',
            type: 'string',
            default: OUTPUT_DIR,
            description: 'Output directory',
          })
          .option('filename', {
            alias: 'f',
            type: 'string',
            default: 'lesson',
            description: 'Output filename (without extension)',
          }),
      async (argv) => {
        const server = await startServer();

        try {
          const generator = await createPdfGenerator(server.url);
          await generator.generatePdf(sampleLessonData, {
            outputDir: argv.output,
            filename: argv.filename,
          });
          await generator.close();
        } finally {
          await stopServer(server);
        }
      }
    )
    .command('serve', 'Start server for manual browser testing', {}, async () => {
      const server = await startServer();
      logger.info(`\nOpen ${server.url} in your browser`);
      logger.info('Press Ctrl+C to stop\n');

      process.on('SIGINT', async () => {
        await stopServer(server);
        process.exit(0);
      });
    })
    .demandCommand(1, 'Specify a command: convert, generate, or serve')
    .help()
    .alias('help', 'h')
    .parse();
}

main().catch((error) => {
  logger.error({ err: error }, 'Error');
  process.exit(1);
});
