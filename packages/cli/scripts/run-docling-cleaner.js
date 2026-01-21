#!/usr/bin/env node

import { readdir } from 'fs/promises';
import { join, basename, extname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATES_DIR = join(__dirname, '../../../docs/example-templates');
const CLEANER_SCRIPT = join(__dirname, '../../core/src/docling-cleaner/cleaner.py');
const PYTHON_VENV = join(__dirname, '../../core/src/docling-cleaner/.venv/bin/python3');

async function runDoclingCleaner(docxPath) {
  const docxName = basename(docxPath);

  console.log(`${docxName}:`);
  console.log('```');

  const command = `"${PYTHON_VENV}" "${CLEANER_SCRIPT}" "${docxPath}"`;

  try {
    const { stdout, stderr } = await execAsync(command);

    // Output the docling markdown
    console.log(stdout.trim());

    // If there are any errors, they'll be in stderr but we might want to ignore them
    // since docling might output warnings that we don't care about
  } catch (error) {
    console.log(`Error processing ${docxName}: ${error.message}`);
  }

  console.log('```');
  console.log(''); // Empty line between files
}

async function main() {
  console.log('Docling Cleaner Runner');
  console.log('======================\n');

  if (!existsSync(TEMPLATES_DIR)) {
    console.error(`Error: Templates directory not found: ${TEMPLATES_DIR}`);
    process.exit(1);
  }

  if (!existsSync(CLEANER_SCRIPT)) {
    console.error(`Error: Cleaner script not found: ${CLEANER_SCRIPT}`);
    process.exit(1);
  }

  if (!existsSync(PYTHON_VENV)) {
    console.error(`Error: Python venv not found: ${PYTHON_VENV}`);
    console.error('Please set up the docling-cleaner virtual environment first.');
    process.exit(1);
  }

  const files = await readdir(TEMPLATES_DIR);
  const docxFiles = files.filter((file) => extname(file).toLowerCase() === '.docx').sort();

  if (docxFiles.length === 0) {
    console.log('No .docx files found in templates directory.');
    process.exit(0);
  }

  console.log(`Found ${docxFiles.length} .docx file(s)\n`);
  console.log('Processing...\n');
  console.log('==================\n');

  for (const docxFile of docxFiles) {
    const docxPath = join(TEMPLATES_DIR, docxFile);
    await runDoclingCleaner(docxPath);
  }

  console.log('✓ All files processed!');
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
