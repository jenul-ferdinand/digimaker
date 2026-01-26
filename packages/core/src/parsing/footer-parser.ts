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
  pygame: 'pygame',
  ruby: 'ruby',
  lua: 'lua',
};

export interface FooterInfo {
  language: ProgrammingLanguage | null;
  level: 1 | 2;
}

/**
 * Extract programming language and level from the footer of a .docx file
 * Expected format: "Level: Scratch-1" or "Level: Python-2"
 */
export async function extractFooterInfo(filePath: string): Promise<FooterInfo> {
  const result: FooterInfo = { language: null, level: 1 };

  try {
    const extractor = new WordExtractor();
    const doc = await extractor.extract(filePath);
    const footerText: string = doc.getFooters().trim().toLowerCase();
    if (!footerText || !footerText.includes('level')) {
      return result;
    }
    logger.debug(`Text found in footer: ${footerText}`);

    // Match format: "Level: <Language>-<Level>" e.g. "Level: Scratch-1" or "Level: Python-2"
    const match = footerText.match(/level:\s*([A-Za-z\s-]+?)-(\d)/i);
    if (match) {
      // Extract language
      const rawLanguage = match[1].trim().toLowerCase();
      const mappedLanguage = LANGUAGE_MAP[rawLanguage];
      if (mappedLanguage) {
        logger.info(`Found programming language in footer: ${mappedLanguage}`);
        result.language = mappedLanguage;
      } else {
        logger.warn(`Language "${rawLanguage}" found in footer but not in language map`);
      }

      // Extract level (1 or 2, default to 1)
      const levelNum = parseInt(match[2], 10);
      if (levelNum === 1 || levelNum === 2) {
        result.level = levelNum;
        logger.info(`Found level in footer: ${result.level}`);
      }
    }

    return result;
  } catch (error) {
    logger.error(`Error extracting footer from ${filePath}: ${error}`);
    return result;
  }
}
