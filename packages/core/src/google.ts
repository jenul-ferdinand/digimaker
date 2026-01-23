import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GoogleGenerativeAIModelId } from '@ai-sdk/google/internal';

export function getGoogleClient() {
  return createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
}

type ModelIdResponse = {
  mainLlm: GoogleGenerativeAIModelId;
  codeFormatterLlm: GoogleGenerativeAIModelId;
};
export function getGoogleModelIds(): ModelIdResponse {
  return {
    mainLlm: process.env.MAIN_GEMINI_MODEL || 'gemini-2.5-pro',
    codeFormatterLlm: process.env.CODE_FORMATTER_GEMINI_MODEL || 'gemini-2.5-flash-lite',
  };
}
