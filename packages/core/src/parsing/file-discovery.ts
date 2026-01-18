import fs from 'fs/promises';
import path from 'path';
import { logger } from '../logger.js';

export interface DiscoveryOptions {
  recursive?: boolean;
}

export interface DiscoveredFile {
  path: string;
  name: string;
}

export async function findDocxFiles(
  target: string,
  options: DiscoveryOptions = {}
): Promise<DiscoveredFile[]> {
  const { recursive = false } = options;
  const resolvedPath = path.resolve(target);

  const stat = await fs.stat(resolvedPath);

  if (stat.isFile()) {
    if (!resolvedPath.endsWith('.docx')) {
      throw new Error(`File is not a .docx: ${resolvedPath}`);
    }
    return [{ path: resolvedPath, name: path.basename(resolvedPath, '.docx') }];
  }

  if (stat.isDirectory()) {
    return scanDirectory(resolvedPath, recursive);
  }

  throw new Error(`Invalid path: ${resolvedPath}`);
}

async function scanDirectory(dir: string, recursive: boolean): Promise<DiscoveredFile[]> {
  const files: DiscoveredFile[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isFile() && entry.name.endsWith('.docx')) {
      files.push({ path: fullPath, name: path.basename(entry.name, '.docx') });
    } else if (entry.isDirectory() && recursive) {
      const nested = await scanDirectory(fullPath, recursive);
      files.push(...nested);
    }
  }

  logger.info(`Found ${files.length} .docx file(s) in ${dir}`);
  return files;
}
