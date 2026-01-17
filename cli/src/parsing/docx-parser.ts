import fs from 'fs/promises';
import { LessonData } from '@common-types/lesson';
import { logger } from '../logger.js';

export interface ParseOptions {
  // Add options as needed
}

export interface ParseResult {
  data: LessonData;
  sourcePath: string;
}

/**
 * Parse a .docx file and extract lesson data
 *
 * TODO: Implement parsing logic using mammoth
 * - Extract title from document
 * - Extract paragraphs/content
 * - Extract images
 * - Extract structured sections (Get Ready, Add Your Code, Challenges, etc.)
 */
export async function parseDocx(
  filePath: string,
  options: ParseOptions = {}
): Promise<ParseResult> {
  logger.info(`Parsing: ${filePath}`);

  const buffer = await fs.readFile(filePath);

  // TODO: Implement actual parsing with mammoth
  // const result = await mammoth.extractRawText({ buffer });
  // const html = await mammoth.convertToHtml({ buffer });

  const data = await extractLessonData(buffer, filePath);

  return { data, sourcePath: filePath };
}

/**
 * Extract structured lesson data from docx content
 *
 * TODO: Implement extraction logic
 */
async function extractLessonData(
  buffer: Buffer,
  filePath: string
): Promise<LessonData> {
  // Placeholder - implement actual extraction
  return {
    id: generateId(filePath),
    title: 'Untitled',
    generatedAt: new Date().toLocaleDateString('en-GB'),
    paragraphs: [],
  };
}

function generateId(filePath: string): string {
  const name = filePath.split('/').pop()?.replace('.docx', '') || 'unknown';
  return name.toUpperCase().replace(/\s+/g, '-');
}
