import path from 'path';
import { execFileSync } from 'child_process';
import { existsSync, readFileSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { logger } from '../logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Detect if running in development mode (monorepo).
 * Dev mode uses uv directly instead of pre-built binaries.
 */
function isDevMode(): boolean {
  // Explicit env var takes priority
  if (process.env.DIGIMAKER_DEV === '1') return true;
  if (process.env.DIGIMAKER_DEV === '0') return false;

  // Check if we're in the monorepo by looking for root package.json with workspaces
  try {
    const rootPkgPath = path.resolve(__dirname, '..', '..', '..', '..', 'package.json');
    if (existsSync(rootPkgPath)) {
      const pkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
      if (pkg.workspaces && pkg.name === 'digimaker-monorepo') {
        return true;
      }
    }
  } catch {
    // Ignore errors, assume not dev mode
  }

  return false;
}
async function resolveDoclingBinary(): Promise<string | null> {
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
    logger.warn({ err: error }, 'Docling binary download failed');
  }

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
      env: {
        ...process.env,
        PYTHONUTF8: '1',
        PYTHONIOENCODING: 'utf-8',
      },
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
  // In dev mode, always use uv to run local Python directly
  if (isDevMode()) {
    logger.debug('Running in dev mode, using uv for docling');
    const result = getDoclingMarkdownFromUv(filePath);
    if (result === null) {
      throw new Error(
        'Docling uv runner failed. Developers must have uv installed. ' +
          'Run: curl -LsSf https://astral.sh/uv/install.sh | sh'
      );
    }
    return result;
  }

  // Production mode: try binary first, then fall back to uv
  const binaryPath = await resolveDoclingBinary();
  if (binaryPath) {
    try {
      return execFileSync(binaryPath, [filePath], {
        encoding: 'utf-8',
        env: {
          ...process.env,
          PYTHONUTF8: '1',
          PYTHONIOENCODING: 'utf-8',
        },
        timeout: 120000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (error) {
      logger.warn({ err: error }, 'Docling binary failed, attempting uv fallback');
    }
  }

  return getDoclingMarkdownFromUv(filePath);
}
