import { z } from 'zod';
import { normaliseCodeBlock } from '../parsing/normalise.js';
import { triggerAsyncId } from 'async_hooks';

export const languageEnum = z.enum([
  'none',
  'scratch',
  'small-basic',
  'javascript or html or css',
  'python',
  'java',
  'c',
]);

export const ImageSlotSchema = z.object({
  id: z.string().describe('Stable image slot identifier (e.g., "addYourCode_img_1")'),
  base64: z.string().optional().describe('Base64 data URI of the image'),
});

export const StepWithImageSchema = z.object({
  step: z.string().describe('The instruction text for this step'),
  imageSlot: ImageSlotSchema.nullable()
    .default(null)
    .describe('Image slot with ID and base64 data if present'),
});

export const StepsWithCodeBlockSchema = z.object({
  steps: z
    .array(z.string())
    .describe('The steps listed above the code block but below the "Add your code" header text'),
  codeBlock: z
    .string()
    .nullable()
    .default(null)
    .describe('The code block that students have to write to get started')
    .transform((val) => normaliseCodeBlock(val)),
});

export const MultipleStepsWithCodeBlockSchema = z.array(StepsWithCodeBlockSchema);

export const ChallengeSchema = z.object({
  name: z
    .string()
    .describe('The name of the specific challenge, excluding the "- New Project" text'),
  task: z
    .string()
    .describe(
      'The task for the challenge, explained as a requirement or feature to add, there could be a hint, if it is definitely not code but plain english, include it'
    ),
  hintCode: z
    .string()
    .nullable()
    .describe('Code that gives a hint on how to complete the challenge (only code allowed)')
    .transform((val) => normaliseCodeBlock(val)),
});

export const NewProjectSchema = z.object({
  name: z
    .string()
    .describe(
      'The name of the new project, usually shown in the header title next to "New Project"'
    ),
  task: z
    .string()
    .describe('The task for the new project, explained as a requirement or new feature to add'),
});

// Representation of any lesson that digimaker provides, dynamic fields that
// account for all possible variations of input.
export const ParsedLessonSchema = z.object({
  topic: z
    .string()
    .describe('The main topic/category of the lesson (e.g., "Decisions", "Loops", "Variables")'),
  project: z
    .string()
    .describe('The name of the project being built (e.g., "Crossy Road", "Space Invaders")'),
  description: z
    .string()
    .describe('A brief description explaining the programming concept being taught'),
  projectExplainer: z.string().describe('Explanation of what will be built in this lesson'),
  programmingLanguage: languageEnum
    .default('none')
    .describe(
      'The programming language used in this lesson, figurable through code visible or wording'
    ),
  prefaceImageSlots: z
    .array(ImageSlotSchema)
    .nullable()
    .default(null)
    .describe('Image slots for the preface, before the "Get Ready" section'),
  getReadySection: z
    .array(z.string())
    .describe('List of setup steps to prepare for the project (adding sprites, backdrops, etc.)'),
  addYourCodeSection: z.union([
    z
      .array(StepWithImageSchema)
      .describe('Step-by-step coding instructions, each step may have an associated image'),
    StepsWithCodeBlockSchema.describe('A block of code given with steps on what it does'),
    MultipleStepsWithCodeBlockSchema.describe(
      'Multiple steps with a code block directly following each, or some without a code block'
    ),
  ]),
  tryItOutSection: z
    .array(z.string())
    .nullable()
    .default(null)
    .describe('Steps to test the project after coding'),
  challengeSection: z
    .array(ChallengeSchema)
    .describe('Challenge tasks for students to extend the project'),
  newProject: NewProjectSchema.describe('Suggestion for a new project or extension activity'),
  testYourself: z
    .string()
    .nullable()
    .default(null)
    .describe('A link to the quiz, found under the "Test Yourself" header'),
  funFact: z
    .string()
    .nullable()
    .default(null)
    .describe('An interesting fact related to the lesson topic'),
});

// The fields that the LLM will not be able to see at all, when generating
// These are populated with rule based logic
const StepWithImageLLMSchema = StepWithImageSchema.omit({ imageSlot: true });
export const ParsedLessonLLMSchema = ParsedLessonSchema.extend({
  addYourCodeSection: z.union([
    z.array(StepWithImageLLMSchema),
    StepsWithCodeBlockSchema,
    MultipleStepsWithCodeBlockSchema,
  ]),
}).omit({
  prefaceImageSlots: true,
});

// Inferred types from zod schemas
export type ProgrammingLanguage = z.infer<typeof languageEnum>;
export interface ImageSlot extends z.infer<typeof ImageSlotSchema> {}
export interface StepWithImage extends z.infer<typeof StepWithImageSchema> {}
export interface StepsWithCodeBlock extends z.infer<typeof StepsWithCodeBlockSchema> {}
export interface MultipleStepsWithCodeBlock extends z.infer<
  typeof MultipleStepsWithCodeBlockSchema
> {}
export interface Challenge extends z.infer<typeof ChallengeSchema> {}
export interface NewProject extends z.infer<typeof NewProjectSchema> {}
export interface ParsedLesson extends z.infer<typeof ParsedLessonSchema> {}
