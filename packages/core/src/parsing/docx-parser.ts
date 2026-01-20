import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import { generateText, Output } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { ParsedLesson, StepWithImage } from '../schemas/index.js';
import { logger } from '../logger.js';
import { extractLanguageFromFooter } from './footer-parser.js';
import { ParsedLessonLLMSchema, ProgrammingLanguage } from '../schemas/lesson.js';
import { parseDoclingMarkdown, assignImagesToSlots } from './docling-parser.js';
import { getDoclingMarkdown } from './docling-runners.js';
import { buildDocxParserPrompt } from './prompts.js';

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

  // Extract images and footer language in parallel, try docling markdown
  const [allImages, footerLanguage, doclingMarkdown] = await Promise.all([
    extractImages(buffer),
    extractLanguageFromFooter(filePath),
    Promise.resolve(getDoclingMarkdown(filePath)),
    // extractCodeBlocksFromDocx(buffer),
  ]);

  // Parse docling markdown to get sections with image placeholders
  let parsedSections = null;
  let textForLLM: string;

  if (doclingMarkdown) {
    parsedSections = parseDoclingMarkdown(doclingMarkdown);
    assignImagesToSlots(parsedSections, allImages);
    textForLLM = doclingMarkdown;
    logger.info('Using docling markdown with placeholder-based image mapping');
    logger.info(textForLLM);
  } else {
    const { value: text } = await mammoth.extractRawText({ buffer });
    textForLLM = text;
    logger.info('Falling back to mammoth text extraction');
    logger.info(textForLLM);
  }

  logger.info(`Extracted ${textForLLM.length} characters and ${allImages.length} images`);
  // if (codeBlocks.length > 0) {
  //   logger.info(`Extracted ${codeBlocks.length} code block(s) from Mammoth`);
  // }
  if (footerLanguage) {
    logger.info(`Programming language from footer: ${footerLanguage}`);
  } else {
    logger.warn('Footer language not found');
  }

  // If we find the programming language in the footer, we don't need the LLM
  // to tell us.
  const llmSchema = footerLanguage
    ? ParsedLessonLLMSchema.omit({ programmingLanguage: true })
    : ParsedLessonLLMSchema;

  // Use LLM to extract structured data
  const { output } = await generateText({
    model: google('gemini-2.5-flash'),
    output: Output.object({
      schema: llmSchema,
    }),
    prompt: buildDocxParserPrompt(textForLLM),
  });

  logger.info(`Successfully extracted lesson: ${output!.topic} - ${output!.project}`);

  // Post-process: assign images and programming language to the extracted data
  const data = output as ParsedLesson;

  // Set programming language from footer if found
  if (footerLanguage) {
    data.programmingLanguage = footerLanguage as ProgrammingLanguage;
  }

  // Assign images using placeholder-based mapping if available
  if (parsedSections) {
    // Assign preface image slots
    if (parsedSections.preface.imageSlots.length > 0) {
      data.prefaceImageSlots = parsedSections.preface.imageSlots;
    }

    // Assign Add Your Code step images
    const addSection = data.addYourCodeSection;
    if (Array.isArray(addSection) && parsedSections.addYourCode.imageSlots.length > 0) {
      const isStepWithImageArray = addSection.every(
        (item) => typeof item === 'object' && item !== null && 'step' in item
      );

      if (isStepWithImageArray) {
        const slots = parsedSections.addYourCode.imageSlots;
        (addSection as StepWithImage[]).forEach((step, index) => {
          if (index < slots.length) {
            step.imageSlot = {
              id: slots[index].id,
              base64: slots[index].base64,
            };
          }
        });
      }
    }
  } else {
    // Fallback using old behavior, first image is project, rest are steps
    // Not good if there are multiple images in preface section
    logger.warn('Falling back to old image assignment behaviour');
    if (allImages.length > 0) {
      data.prefaceImageSlots = [{ id: 'fallback_preface_img_1', base64: allImages[0] }];
    }
    const stepImages = allImages.slice(1);

    const addSection = data.addYourCodeSection;
    if (stepImages.length > 0 && Array.isArray(addSection)) {
      const isStepWithImageArray = addSection.every(
        (item) => typeof item === 'object' && item !== null && 'step' in item
      );

      if (isStepWithImageArray) {
        (addSection as StepWithImage[]).forEach((step, index) => {
          if (stepImages[index]) {
            step.imageSlot = {
              id: `fallback_img_${index + 1}`,
              base64: stepImages[index],
            };
          }
        });
      }
    }
  }

  logger.info(data);

  return {
    data,
    sourcePath: filePath,
  };
}
