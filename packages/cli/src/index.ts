#!/usr/bin/env node
import 'dotenv/config';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import readline from 'readline/promises';
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

async function ensureGeminiKey(): Promise<boolean> {
  if (process.env.GEMINI_API_KEY) {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
    }
    return true;
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    logger.error('GEMINI_API_KEY is required. Set it or pass --gemini-key.');
    return false;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const key = await rl.question('Enter GEMINI_API_KEY (input will be visible): ');
  rl.close();

  const trimmed = key.trim();
  if (!trimmed) {
    logger.error('GEMINI_API_KEY is required. Set it or pass --gemini-key.');
    return false;
  }

  process.env.GEMINI_API_KEY = trimmed;
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = trimmed;
  return true;
}

async function main() {
  await yargs(hideBin(process.argv))
    .scriptName('digimaker')
    .usage('$0 <command> [options]')
    // Root options
    .option('gemini-key', {
      type: 'string',
      description: 'Gemini API key (overrides GEMINI_API_KEY)',
    })
    .option('cheaper', {
      type: 'boolean',
      default: false,
      description: 'Use cheaper models or better models?',
    })
    .middleware((argv) => {
      if (argv.geminiKey) {
        process.env.GEMINI_API_KEY = String(argv.geminiKey);
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = String(argv.geminiKey);
      }

      if (argv.cheaper) {
        process.env.MAIN_GEMINI_MODEL = 'gemini-2.5-flash';
        process.env.CODE_FORMATTER_GEMINI_MODEL = 'gemini-2.0-flash';
      } else {
        process.env.MAIN_GEMINI_MODEL = 'gemini-2.5-pro';
        process.env.CODE_FORMATTER_GEMINI_MODEL = 'gemini-2.5-flash-lite';
      }
    })
    // Main conversion command to convert docx
    // E.g., > digimaker convert <optional-path>
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
        const hasKey = await ensureGeminiKey();
        if (!hasKey) {
          return;
        }

        // Find and store docx files to convert
        const targetPath = path.resolve(argv.path);
        const files = await findDocxFiles(targetPath, { recursive: argv.recursive });
        if (files.length === 0) {
          logger.warn('No .docx files found');
          return;
        }
        logger.info(`Converting ${files.length} file(s) with concurrency ${argv.concurrency}...`);

        // Prepare the frontend server for data injection and PDF generation
        // Used by puppeteer, see pdf-generator.ts
        const server = await startServer();

        try {
          // Start conversion and generation process
          const generator = await createPdfGenerator(server.url);
          const results = await convertWithConcurrency(
            files,
            generator,
            argv.output,
            argv.concurrency
          );
          await generator.close();

          // Log the summary of things
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
          // Stop the frontend server once done
          await stopServer(server);
        }
      }
    )
    // Command for testing PDF generation using sample data
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
    .parseAsync();
}

main().catch((error) => {
  logger.error({ err: error }, 'Error');
  process.exit(1);
});
