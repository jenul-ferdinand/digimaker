#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import { startServer, stopServer } from './server.js';
import { createPdfGenerator } from './pdf-generator.js';
import { sampleLessonData } from './sample-data.js';
import { logger } from './logger.js';

const OUTPUT_DIR = path.resolve(process.cwd(), 'output');

async function main() {
  await yargs(hideBin(process.argv))
    .scriptName('digimaker')
    .usage('$0 <command> [options]')
    .command(
      'generate',
      'Generate a PDF from sample data',
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
    .command(
      'serve',
      'Start server for manual browser testing',
      {},
      async () => {
        const server = await startServer();
        logger.info(`\nOpen ${server.url} in your browser`);
        logger.info('Press Ctrl+C to stop\n');

        process.on('SIGINT', async () => {
          await stopServer(server);
          process.exit(0);
        });
      }
    )
    .demandCommand(1, 'Specify a command: generate or serve')
    .help()
    .alias('help', 'h')
    .parse();
}

main().catch((error) => {
  logger.error({ err: error }, 'Error');
  process.exit(1);
});
