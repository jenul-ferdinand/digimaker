import { logger } from '../logger.js';
import { ProgrammingLanguage } from '../schemas/lesson.js';

// @ts-expect-error
import WordExtractor from 'word-extractor';

const LANGUAGE_MAP: Record<string, ProgrammingLanguage> = {
  scratch: 'scratch',
  'small-basic': 'small-basic',
  'small basic': 'small-basic',
  smallbasic: 'small-basic',
  python: 'python',
  java: 'java',
  javascript: 'javascript or html or css',
  html: 'javascript or html or css',
  css: 'javascript or html or css',
  c: 'c',
};

/**
 * Extract programming language from the footer of a .docx file
 * Expected format: "Level: Scratch-1" or "Level: Python-2"
 * Output: the mapped language for the programming language
 */
export async function extractLanguageFromFooter(filePath: string): Promise<string | null> {
  try {
    const extractor = new WordExtractor();
    const doc = await extractor.extract(filePath);
    const footerText: string = doc.getFooters().trim().toLowerCase();
    if (!footerText || !footerText.includes('level')) {
      return null;
    }
    logger.debug(`Text found in footer: ${footerText}`);

    const levelMatch = footerText.match(/level:\s*([A-Za-z\s-]+?)[-\d]/i);
    if (levelMatch && levelMatch[1]) {
      const rawLanguage = levelMatch[1].trim().toLowerCase();
      const mappedLanguage = LANGUAGE_MAP[rawLanguage];
      if (mappedLanguage) {
        logger.info(`Found programming language in footer: ${mappedLanguage}`);
        return mappedLanguage;
      } else {
        logger.warn(`Language "${rawLanguage}" found in footer but not in language map`);
      }
    }

    return null;
  } catch (error) {
    logger.error(`Error extracting footer from ${filePath}: ${error}`);
    return null;
  }
}
