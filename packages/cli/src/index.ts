#!/usr/bin/env node
import 'dotenv/config';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import {
  startServer,
  stopServer,
  createPdfGenerator,
  convertWithConcurrency,
  findDocxFiles,
  sampleLessonData,
  logger,
  POOL_SIZE,
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
          })
          .option('concurrency', {
            alias: 'c',
            type: 'number',
            default: POOL_SIZE,
            description: 'Maximum concurrent file processing',
          }),
      async (argv) => {
        const targetPath = path.resolve(argv.path);
        const files = await findDocxFiles(targetPath, { recursive: argv.recursive });

        if (files.length === 0) {
          logger.warn('No .docx files found');
          return;
        }

        logger.info(`Converting ${files.length} file(s) with concurrency ${argv.concurrency}...`);

        const server = await startServer();

        try {
          const generator = await createPdfGenerator(server.url);

          const results = await convertWithConcurrency(
            files,
            generator,
            argv.output,
            argv.concurrency
          );

          await generator.close();

          // Summary
          const succeeded = results.filter((r) => r.success);
          const failed = results.filter((r) => !r.success);

          logger.info('');
          logger.info('=== Conversion Summary ===');
          logger.info(`Succeeded: ${succeeded.length}`);
          logger.info(`Failed: ${failed.length}`);

          if (failed.length > 0) {
            logger.info('');
            logger.info('Failed files:');
            for (const f of failed) {
              logger.info(`  - ${f.file}: ${f.error}`);
            }
          }

          if (succeeded.length > 0) {
            logger.info('');
            logger.info(`PDFs saved to: ${argv.output}`);
          }
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
}

main().catch((error) => {
  logger.error({ err: error }, 'Error');
  process.exit(1);
});
