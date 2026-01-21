import fs from 'fs/promises';
import mammoth from 'mammoth';
import { generateText, Output } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { Lesson, StepWithImage } from '../schemas/index.js';
import { logger } from '../logger.js';
import { extractLanguageFromFooter } from './footer-parser.js';
import {
  LessonLLM,
  LessonLLMSchema,
  LessonLLMSchemaWithoutLanguage,
  ProgrammingLanguage,
} from '../schemas/lesson.js';
import { parseDoclingMarkdown, assignImagesToSlots } from './docling-parser.js';
import { getDoclingMarkdown } from './docling-runners.js';
import { buildDocxParserPrompt, docxParserSystemPrompt } from './prompts.js';
import { formatDocumentCode } from '../agents/code-formatter.js';
import { inferLessonType, normaliseLessonContent } from './post-processors.js';

export interface ParseResult {
  data: Lesson;
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
    logger.info('Formatting document code blocks with agent');
    textForLLM = await formatDocumentCode(doclingMarkdown);
    logger.info(textForLLM);
  } else {
    const { value: text } = await mammoth.extractRawText({ buffer });
    textForLLM = text;
    logger.info('Falling back to mammoth text extraction');
    logger.info(textForLLM);
  }

  logger.info(`Extracted ${textForLLM.length} characters and ${allImages.length} images`);
  if (footerLanguage) {
    logger.info(`Programming language from footer: ${footerLanguage}`);
  } else {
    logger.warn('Footer language not found');
  }

  // If we find the programming language in the footer, we don't need the LLM
  // to tell us.
  const llmSchema = footerLanguage ? LessonLLMSchemaWithoutLanguage : LessonLLMSchema;

  let output: unknown;
  try {
    // Use LLM to extract structured data
    const response = await generateText({
      model: google('gemini-2.5-flash'),
      output: Output.object({
        schema: llmSchema,
      }),
      system: docxParserSystemPrompt,
      prompt: buildDocxParserPrompt(textForLLM),
      temperature: 0,
      maxRetries: 5,
    });
    output = response.output;
  } catch (error) {
    const err = error as any;
    logger.error({ err, filePath }, 'LLM extraction failed');

    const issues = err?.cause?.issues ?? err?.issues;
    if (issues) {
      logger.error({ issues, filePath }, 'LLM schema validation issues');
    }

    const value = err?.cause?.value ?? err?.value;
    if (value) {
      logger.error({ value, filePath }, 'LLM output that failed validation');
    }

    throw error;
  }

  // Infer the lesson type with heuristic
  const dataWithoutType = normaliseLessonContent(output as LessonLLM);
  const data = {
    ...dataWithoutType,
    lessonType: inferLessonType(
      textForLLM,
      footerLanguage as ProgrammingLanguage,
      dataWithoutType
    ),
  } as Lesson;
  logger.info(`Inferred lesson type as: '${data.lessonType}'`);
  logger.info(`Successfully extracted lesson: ${data.topic} - ${data.project}`);

  // Set programming language from footer if found
  if (footerLanguage) {
    data.programmingLanguage = footerLanguage as ProgrammingLanguage;
  }

  // Assign images using placeholder-based mapping if available
  if (parsedSections && data.lessonType !== 'debugging lesson') {
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
  } else if (data.lessonType !== 'debugging lesson') {
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
