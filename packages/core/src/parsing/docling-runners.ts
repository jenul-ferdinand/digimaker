import path from 'path';
import { execFileSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { logger } from '../logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function resolveDoclingBinary(): Promise<string | null> {
  const platformTag = `${process.platform}-${process.arch}`;
  const binaryName = process.platform === 'win32' ? 'docling-cleaner.exe' : 'docling-cleaner';

  try {
    const { ensureDoclingCleaner } = await import('@digimakers/docling-cleaner');
    const binaryPath = await ensureDoclingCleaner();
    if (binaryPath && existsSync(binaryPath)) {
      try {
        if (statSync(binaryPath).isFile()) return binaryPath;
      } catch {
        // Ignore invalid paths.
      }
    }
  } catch (error) {
    logger.warn({ err: error }, 'Docling downloader failed, trying bundled binaries');
  }

  const distBinary = path.resolve(
    __dirname,
    '..',
    'docling-cleaner',
    'bin',
    platformTag,
    binaryName
  );
  if (existsSync(distBinary)) return distBinary;

  const distOnedirBinary = path.resolve(
    __dirname,
    '..',
    'docling-cleaner',
    'bin',
    platformTag,
    'docling-cleaner',
    binaryName
  );
  if (existsSync(distOnedirBinary)) return distOnedirBinary;

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

  const srcOnedirBinary = path.resolve(
    __dirname,
    '..',
    '..',
    'src',
    'docling-cleaner',
    'bin',
    platformTag,
    'docling-cleaner',
    binaryName
  );
  if (existsSync(srcOnedirBinary)) return srcOnedirBinary;

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

export async function getDoclingMarkdown(filePath: string): Promise<string | null> {
  const binaryPath = await resolveDoclingBinary();
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
