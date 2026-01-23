import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '..', 'src', 'docling-cleaner');
const destDir = path.resolve(__dirname, '..', 'dist', 'docling-cleaner');
const cleanerScript = path.resolve(srcDir, 'cleaner.py');
const pyprojectFile = path.resolve(srcDir, 'pyproject.toml');
const uvLockFile = path.resolve(srcDir, 'uv.lock');

if (!fs.existsSync(srcDir)) {
  console.error(`docling-cleaner source not found at ${srcDir}`);
  process.exit(1);
}

fs.rmSync(destDir, { recursive: true, force: true });
fs.mkdirSync(destDir, { recursive: true });

if (fs.existsSync(cleanerScript)) {
  fs.copyFileSync(cleanerScript, path.join(destDir, 'cleaner.py'));
}
if (fs.existsSync(pyprojectFile)) {
  fs.copyFileSync(pyprojectFile, path.join(destDir, 'pyproject.toml'));
}
if (fs.existsSync(uvLockFile)) {
  fs.copyFileSync(uvLockFile, path.join(destDir, 'uv.lock'));
}

console.log(`Copied docling-cleaner runtime assets to ${destDir}`);
