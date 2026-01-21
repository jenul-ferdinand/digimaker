import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { codeFormatterPrompt, codeFormatterSystemPrompt } from '../parsing/prompts';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function formatDocumentCode(document: string) {
  const { text } = await generateText({
    model: google('gemini-2.0-flash'),
    system: codeFormatterSystemPrompt,
    prompt: codeFormatterPrompt(document),
    temperature: 0,
  });
  return text;
}
