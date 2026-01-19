#!/usr/bin/env node

/**
 * Bundle frontend assets into the CLI dist folder.
 * This script copies the built Angular frontend into the CLI package
 * so it can be distributed as a single npm package.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_ROOT = path.resolve(__dirname, '..');
const FRONTEND_SRC = path.resolve(CLI_ROOT, '../frontend/dist/frontend/browser');
const FRONTEND_DEST = path.resolve(CLI_ROOT, 'dist/frontend/browser');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`Source directory not found: ${src}`);
    console.error('Make sure to build the frontend first: npm run build:frontend');
    process.exit(1);
  }

  // Create destination directory
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Bundling frontend assets into CLI package...');
console.log(`  Source: ${FRONTEND_SRC}`);
console.log(`  Destination: ${FRONTEND_DEST}`);

try {
  // Remove existing frontend bundle if present
  if (fs.existsSync(FRONTEND_DEST)) {
    fs.rmSync(FRONTEND_DEST, { recursive: true });
  }

  copyDir(FRONTEND_SRC, FRONTEND_DEST);

  // Count files copied
  const countFiles = (dir) => {
    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        count += countFiles(path.join(dir, entry.name));
      } else {
        count++;
      }
    }
    return count;
  };

  const fileCount = countFiles(FRONTEND_DEST);
  console.log(`Successfully bundled ${fileCount} frontend files.`);
} catch (error) {
  console.error('Failed to bundle frontend:', error.message);
  process.exit(1);
}
