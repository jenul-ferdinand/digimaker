import path from 'path';
import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { logger } from '../logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveDoclingBinary(): string | null {
  const platformTag = `${process.platform}-${process.arch}`;
  const binaryName = process.platform === 'win32' ? 'docling-cleaner.exe' : 'docling-cleaner';

  const distBinary = path.resolve(
    __dirname,
    '..',
    'docling-cleaner',
    'bin',
    platformTag,
    binaryName
  );
  if (existsSync(distBinary)) return distBinary;

  const srcBinary = path.resolve(
    __dirname,
    '..',
    '..',
    'src',
    'docling-cleaner',
    'bin',
    platformTag,
    binaryName
  );
  if (existsSync(srcBinary)) return srcBinary;

  return null;
}

function resolveDoclingCleanerDir(): string | null {
  const distCleanerDir = path.resolve(__dirname, '..', 'docling-cleaner');
  if (existsSync(path.join(distCleanerDir, 'cleaner.py'))) return distCleanerDir;

  const srcCleanerDir = path.resolve(__dirname, '..', '..', 'src', 'docling-cleaner');
  if (existsSync(path.join(srcCleanerDir, 'cleaner.py'))) return srcCleanerDir;

  return null;
}

function getDoclingMarkdownFromUv(filePath: string): string | null {
  const cleanerDir = resolveDoclingCleanerDir();
  if (!cleanerDir) {
    logger.warn(
      'Docling cleaner assets not found. Ensure the package includes dist/docling-cleaner.'
    );
    return null;
  }
  try {
    return execFileSync('uv', ['run', 'python', 'cleaner.py', filePath], {
      cwd: cleanerDir,
      encoding: 'utf-8',
      timeout: 120000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    logger.warn(
      { err: error },
      'Docling uv fallback failed. Install uv and run in packages/core/src/docling-cleaner.'
    );
    return null;
  }
}

export function getDoclingMarkdown(filePath: string): string | null {
  const binaryPath = resolveDoclingBinary();
  if (binaryPath) {
    try {
      return execFileSync(binaryPath, [filePath], {
        encoding: 'utf-8',
        timeout: 120000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (error) {
      logger.warn({ err: error }, 'Docling binary failed, attempting uv fallback');
    }
  }

  return getDoclingMarkdownFromUv(filePath);
}
