import fs from 'fs/promises';
import mammoth from 'mammoth';
import { generateText, Output } from 'ai';
import { Lesson, StepWithImage } from '../schemas/index.js';
import { logger } from '../logger.js';
import { extractFooterInfo } from './footer-parser.js';
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
import {
  enrichDebugIssues,
  inferLessonType,
  normaliseLessonContent,
  normaliseLessonForType,
} from './post-processors.js';
import { getGoogleClient, getGoogleModelIds } from '../google.js';

export interface ParseResult {
  data: Lesson;
  sourcePath: string;
}

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
  const [allImages, footerInfo, doclingMarkdown] = await Promise.all([
    extractImages(buffer),
    extractFooterInfo(filePath),
    getDoclingMarkdown(filePath),
  ]);
  const { language: footerLanguage, level: footerLevel } = footerInfo;

  // Parse docling markdown to get sections with image placeholders
  let parsedSections = null;
  let textForLLM: string;
  if (doclingMarkdown) {
    parsedSections = parseDoclingMarkdown(doclingMarkdown);
    assignImagesToSlots(parsedSections, allImages);
    logger.debug(
      {
        prefaceImageSlots: parsedSections.preface.imageSlots.length,
        addYourCodeImageSlots: parsedSections.addYourCode.imageSlots.length,
        totalImages: allImages.length,
      },
      'Docling image slots parsed'
    );
    textForLLM = doclingMarkdown;
    logger.info('Using docling markdown with placeholder-based image mapping');
    logger.info(textForLLM);
    textForLLM = await formatDocumentCode(doclingMarkdown, footerLanguage);
    logger.info(textForLLM);
  } else {
    // Mammoth fallback if docling is not available, no parsedSections
    const { value: text } = await mammoth.extractRawText({ buffer });
    textForLLM = text;
    logger.info('Falling back to mammoth text extraction');
    logger.info(textForLLM);
  }

  logger.info(`Extracted ${textForLLM.length} characters and ${allImages.length} images`);
  if (footerLanguage) {
    logger.info(`Programming language from footer: ${footerLanguage}`);
  } else {
    logger.warn('Programming language not found from footer, LLM must determine');
  }

  // If we find the programming language in the footer,
  // we don't need the LLM to figure it out.
  const llmSchema = footerLanguage ? LessonLLMSchemaWithoutLanguage : LessonLLMSchema;

  let output: unknown;
  try {
    // Use LLM to extract structured data
    const model = getGoogleModelIds().mainLlm;
    logger.info(`Extracting structured data using ${model} model`);
    const response = await generateText({
      model: getGoogleClient()(model),
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
    // Handle LLM errors
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
  let data = normaliseLessonForType({
    ...dataWithoutType,
    lessonType: inferLessonType(textForLLM, footerLanguage as ProgrammingLanguage, dataWithoutType),
  } as Lesson);
  data = enrichDebugIssues(textForLLM, data);
  logger.info(`Inferred lesson type as: '${data.lessonType}'`);
  logger.info(`Successfully extracted lesson: ${data.topic} - ${data.project}`);

  // Set rule-based fields from footer
  if (footerLanguage) {
    data.programmingLanguage = footerLanguage as ProgrammingLanguage;
  }
  data.level = footerLevel;

  // Debugging lessons have no images, exit early
  if (data.lessonType === 'debugging lesson') {
    logger.info(data);
    return {
      data,
      sourcePath: filePath,
    };
  }

  // Image assignment (two methods)
  if (parsedSections) {
    // Assign images using placeholder-based mapping if available
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
