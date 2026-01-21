#!/usr/bin/env node

import { readdir, mkdir } from 'fs/promises';
import { join, basename, extname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_DIR = join(__dirname, '../output');

async function convertPdfToPngs(pdfPath, outputFolder) {
  const pdfName = basename(pdfPath, extname(pdfPath));
  const targetDir = join(outputFolder, pdfName);

  if (!existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true });
  }

  console.log(`Converting ${pdfName}...`);

  const outputPrefix = join(targetDir, 'page');

  // Use pdftoppm to convert PDF to PNG
  // -png: output format
  // -r 150: resolution (DPI)
  const command = `pdftoppm -png -r 150 "${pdfPath}" "${outputPrefix}"`;

  try {
    await execAsync(command);
    console.log(`✓ Converted ${pdfName} to PNGs in ${targetDir}`);
  } catch (error) {
    console.error(`✗ Failed to convert ${pdfName}:`, error.message);
  }
}

async function main() {
  console.log('PDF to PNG Converter');
  console.log('====================\n');

  if (!existsSync(OUTPUT_DIR)) {
    console.error(`Error: Output directory not found: ${OUTPUT_DIR}`);
    process.exit(1);
  }

  const files = await readdir(OUTPUT_DIR);
  const pdfFiles = files.filter(file => extname(file).toLowerCase() === '.pdf');

  if (pdfFiles.length === 0) {
    console.log('No PDF files found in output directory.');
    process.exit(0);
  }

  console.log(`Found ${pdfFiles.length} PDF file(s)\n`);

  for (const pdfFile of pdfFiles) {
    const pdfPath = join(OUTPUT_DIR, pdfFile);
    await convertPdfToPngs(pdfPath, OUTPUT_DIR);
  }

  console.log('\n✓ All conversions complete!');
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
