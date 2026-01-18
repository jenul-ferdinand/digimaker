import fs from 'fs/promises';
import mammoth from 'mammoth';
import { generateText, Output } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { ParsedLessonSchema, ParsedLesson } from '../schemas/index.js';
import { logger } from '../logger.js';

export interface ParseResult {
  data: ParsedLesson;
  sourcePath: string;
}

// Setup google generative ai
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Extract images from docx as base64 data URIs
async function extractImages(buffer: Buffer): Promise<string[]> {
  const images: string[] = [];

  await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const imageBuffer = await image.read();
        const base64 = imageBuffer.toString('base64');
        const dataUri = `data:${image.contentType};base64,${base64}`;
        images.push(dataUri);
        return { src: dataUri };
      }),
    }
  );

  return images;
}

// Parse a .docx file and extract lesson data
export async function parseDocx(filePath: string): Promise<ParseResult> {
  logger.info(`Parsing: ${filePath}`);

  const buffer = await fs.readFile(filePath);

  // Extract text and images in parallel
  const [{ value: text }, allImages] = await Promise.all([
    mammoth.extractRawText({ buffer }),
    extractImages(buffer),
  ]);
  logger.info(text);
  logger.info(allImages);

  logger.debug(`Extracted ${text.length} characters and ${allImages.length} images`);

  // First image is project cover, rest are for code steps
  const projectImage = allImages.length > 0 ? allImages[0] : null;
  const stepImages = allImages.slice(1);

  logger.info(
    `Found ${stepImages.length} step images, projectImage: ${projectImage ? 'yes' : 'no'}`
  );

  // Use LLM to extract structured data
  const { output } = await generateText({
    model: google('gemini-2.0-flash'),
    output: Output.object({
      schema: ParsedLessonSchema,
    }),
    prompt: `Extract structured lesson data from this educational document.

This is a programming lesson sheet for students. Extract all the relevant sections and content.

If a section is not present in the document, use empty arrays for array fields, empty strings for required string fields, and null for nullable fields.

For the addYourCodeSection, each step should be a clear instruction. Set image to null for all steps (images will be added separately).

Document content:
${text}`,
  });

  logger.info(output);
  logger.info(`Successfully extracted lesson: ${output!.topic} - ${output!.project}`);

  // Post-process: assign images to the extracted data
  const data = output as ParsedLesson;
  data.projectImage = projectImage;

  // Assign step images in order
  if (stepImages.length > 0 && Array.isArray(data.addYourCodeSection)) {
    data.addYourCodeSection.forEach((step, index) => {
      step.image = stepImages[index] ?? null;
    });
  }
  logger.info(data);

  return {
    data,
    sourcePath: filePath,
  };
}
