import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { codeFormatterPrompt, codeFormatterSystemPrompt } from '../parsing/prompts.js';
import { logger } from '../logger.js';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function formatDocumentCode(document: string, footerLanguage: string | null) {
  logger.debug('Formatting document code blocks with code formatter LLM');
  if (!footerLanguage || footerLanguage != 'scratch') {
    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      system: codeFormatterSystemPrompt,
      prompt: codeFormatterPrompt(document),
      temperature: 0,
    });
    logger.debug('Done formatting document code blocks');
    return text;
  }
  logger.debug("Did not format document code blcoks because it's a scratch lesson");
  return document;
}
