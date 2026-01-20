import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '..', 'src', 'docling-cleaner');
const destDir = path.resolve(__dirname, '..', 'dist', 'docling-cleaner');
const srcBinDir = path.resolve(srcDir, 'bin');
const destBinDir = path.resolve(destDir, 'bin');
const cleanerScript = path.resolve(srcDir, 'cleaner.py');

if (!fs.existsSync(srcDir)) {
  console.error(`docling-cleaner source not found at ${srcDir}`);
  process.exit(1);
}

fs.rmSync(destDir, { recursive: true, force: true });
fs.mkdirSync(destDir, { recursive: true });

if (fs.existsSync(srcBinDir)) {
  fs.mkdirSync(destBinDir, { recursive: true });
  fs.cpSync(srcBinDir, destBinDir, { recursive: true });
} else {
  console.warn(`docling-cleaner bin not found at ${srcBinDir}`);
}

if (fs.existsSync(cleanerScript)) {
  fs.copyFileSync(cleanerScript, path.join(destDir, 'cleaner.py'));
}

console.log(`Copied docling-cleaner runtime assets to ${destDir}`);
