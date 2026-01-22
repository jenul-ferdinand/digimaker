import path from 'path';
import { execFileSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { logger } from '../logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const PLATFORM_PACKAGE_MAP: Record<string, string> = {
  'linux-x64': '@digimakers/docling-cleaner-linux-x64',
  'darwin-x64': '@digimakers/docling-cleaner-darwin-x64',
  'darwin-arm64': '@digimakers/docling-cleaner-darwin-arm64',
  'win32-x64': '@digimakers/docling-cleaner-win32-x64',
};

function resolveDoclingBinary(): string | null {
  const platformTag = `${process.platform}-${process.arch}`;
  const binaryName = process.platform === 'win32' ? 'docling-cleaner.exe' : 'docling-cleaner';

  const packageName = PLATFORM_PACKAGE_MAP[platformTag];
  if (packageName) {
    try {
      const { binaryPath } = require(packageName);
      if (binaryPath && existsSync(binaryPath)) {
        try {
          if (statSync(binaryPath).isFile()) return binaryPath;
        } catch {
          // Ignore invalid paths.
        }
      }

      const pkgJsonPath = require.resolve(`${packageName}/package.json`);
      const pkgDir = path.dirname(pkgJsonPath);
      const packageBinary = path.join(pkgDir, 'bin', binaryName);
      if (existsSync(packageBinary)) return packageBinary;

      const packageOnedirBinary = path.join(pkgDir, 'bin', 'docling-cleaner', binaryName);
      if (existsSync(packageOnedirBinary)) return packageOnedirBinary;
    } catch {
      // Optional dependency may not be installed for this platform.
    }
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
