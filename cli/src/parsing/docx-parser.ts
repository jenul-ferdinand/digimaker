import fs from 'fs/promises';
import mammoth from 'mammoth';
import 'dotenv/config';
import { generateText, Output } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { ParsedLesson } from '@common-types/lesson';
import { logger } from '../logger.js';

// Zod schema matching ParsedLesson interface
const StepWithImageSchema = z.object({
  step: z.string().describe('The instruction text for this step'),
  image: z.string().nullable().describe('Image reference if present, otherwise null'),
});

const TestYourselfSchema = z.object({
  message: z.string().describe('The test yourself question or prompt'),
  image: z.string().nullable().describe('Image reference if present'),
  code: z.string().nullable().describe('Code snippet if present'),
});

const ParsedLessonSchema = z.object({
  topic: z.string().describe('The main topic/category of the lesson (e.g., "Decisions", "Loops", "Variables")'),
  project: z.string().describe('The name of the project being built (e.g., "Crossy Road", "Space Invaders")'),
  description: z.string().describe('A brief description explaining the programming concept being taught'),
  projectExplainer: z.string().describe('Explanation of what will be built in this lesson'),
  projectImage: z.string().nullable().describe('Reference to the main project image if present'),
  getReadySection: z.array(z.string()).describe('List of setup steps to prepare for the project (adding sprites, backdrops, etc.)'),
  addYourCodeSection: z.array(StepWithImageSchema).describe('Step-by-step coding instructions, each step may have an associated image'),
  codeBlock: z.string().nullable().describe('A single code block if the lesson uses text-based code instead of visual blocks'),
  tryItOutSection: z.array(z.string()).nullable().describe('Steps to test the project after coding'),
  challengeSection: z.array(z.string()).describe('Challenge tasks for students to extend the project'),
  newProject: z.string().describe('Suggestion for a new project or extension activity'),
  testYourself: TestYourselfSchema.describe('Self-assessment question for the student'),
  funFact: z.string().nullable().describe('An interesting fact related to the lesson topic'),
});

export interface ParseOptions {
  model?: string;
}

export interface ParseResult {
  data: ParsedLesson;
  sourcePath: string;
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY, 
});

/**
 * Extract images from docx as base64 data URIs
 */
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

/**
 * Parse a .docx file and extract lesson data using LLM
 */
export async function parseDocx(
  filePath: string,
  options: ParseOptions = {}
): Promise<ParseResult> {
  logger.info(`Parsing: ${filePath}`);

  const buffer = await fs.readFile(filePath);

  // Extract text and images in parallel
  const [{ value: text }, allImages] = await Promise.all([
    mammoth.extractRawText({ buffer }),
    extractImages(buffer),
  ]);
  logger.info(allImages);

  logger.debug(`Extracted ${text.length} characters and ${allImages.length} images`);

  // First image is project cover, rest are for code steps
  const projectImage = allImages.length > 0 ? allImages[0] : null;
  const stepImages = allImages.slice(1);

  logger.info(`Found ${stepImages.length} step images, projectImage: ${projectImage ? 'yes' : 'no'}`);

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

  logger.info(output)
  logger.info(`Successfully extracted lesson: ${output!.topic} - ${output!.project}`);

  // Post-process: assign images to the extracted data
  const data = output as ParsedLesson;
  data.projectImage = projectImage;

  // Assign step images in order
  if (stepImages.length > 0 && data.addYourCodeSection) {
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
