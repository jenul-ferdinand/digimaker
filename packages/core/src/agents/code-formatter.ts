import { generateText } from 'ai';
import { codeFormatterPrompt, codeFormatterSystemPrompt } from '../parsing/prompts.js';
import { logger } from '../logger.js';
import { GoogleGenerativeAIModelId } from '@ai-sdk/google/internal';
import { getGoogleClient, getGoogleModelIds } from '../google.js';

export async function formatDocumentCode(document: string, footerLanguage: string | null) {
  if (!footerLanguage || footerLanguage != 'scratch') {
    const model: GoogleGenerativeAIModelId = getGoogleModelIds().codeFormatterLlm;
    logger.debug(`Formatting the code blocks of document text using ${model} model`);
    const { text } = await generateText({
      model: getGoogleClient()(model),
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
