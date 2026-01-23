import { z } from 'zod';
import { normaliseCodeBlock, normaliseText } from '../parsing/normalise.js';

export const languageEnum = z.enum([
  'none',
  'scratch',
  'small-basic',
  'javascript or html or css',
  'python',
  'java',
  'c',
]);

// NOTE: Fields with no describe() are assigned using rule-based logic.

// Reusable pieces that are apart of the standard lesson
export const ImageSlotSchema = z.object({
  id: z.string(),
  base64: z.string().optional(),
});
export const StepsWithCodeBlockSchema = z.object({
  steps: z
    .array(z.string())
    .describe('The steps listed above the code block but below the "Add your code" header text'),
  codeBlock: z
    .string()
    .nullable()
    .default(null)
    .describe(
      'The code block that students have to write to get started (white-space and new-lines preserved)'
    ),
});
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
    .describe(
      'Code that gives a hint on how to complete the challenge (only code allowed, perserve whitespace and add line breaks)'
    ),
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

// Lesson level enum (1 or 2)
export const levelEnum = z.union([z.literal(1), z.literal(2)]).default(1);

// Programming text-based lessons
export const ProgrammingLessonSchema = z.object({
  lessonType: z.literal('text-based (programming) lesson'),
  level: levelEnum,
  topic: z
    .string()
    .describe('The main topic/category of the lesson (e.g., "Decisions", "Loops", "Variables")'),
  project: z
    .string()
    .describe('The name of the project being built (e.g., "Crossy Road", "Space Invaders")'),
  description: z
    .string()
    .describe('A brief description explaining the programming concept being taught')
    .transform((val) => {
      return normaliseText(val) ?? val;
    }),
  projectExplainer: z.string().describe('Explanation of what will be built in this lesson'),
  programmingLanguage: languageEnum
    .default('none')
    .describe(
      'The programming language used in this lesson, figurable through code visible or wording'
    ),
  prefaceImageSlots: z
    .array(ImageSlotSchema)
    .nullable()
    .describe('Image slots for the preface, before the "Get Ready" section'),
  getReadySection: z
    .array(z.string())
    .describe('List of setup steps to prepare for the project (adding sprites, backdrops, etc.)'),
  addYourCodeSection: z
    .array(StepsWithCodeBlockSchema)
    .describe(
      'Multiple steps with a code block directly following each, or some without a code block. If there is only one step provide it as an array with one item'
    )
    .nullable()
    .describe(
      'Section that guides students on adding the base code. Null only when it is a debugging lesson'
    ),
  tryItOutSection: z
    .array(z.string())
    .nullable()
    .describe('Steps to test the project after coding. Null only when it is a debugging lesson'),
  challengeSection: z
    .array(ChallengeSchema)
    .nullable()
    .describe(
      'Challenge tasks for students to extend the project. Null only when it is a debugging lesson'
    ),
  newProject: NewProjectSchema.nullable().describe(
    'Suggestion for a new project or extension activity. Null only when it is a debugging lesson'
  ),
  testYourself: z.url().nullable().describe('A url under the "Test Yourself" header'),
  funFact: z.string().nullable().describe('An interesting fact related to the lesson topic'),
}); // LLM version of the same schema (omit rule-based fields)
const StandardLessonLLMSchema = ProgrammingLessonSchema.omit({
  level: true,
  prefaceImageSlots: true,
});

// Scratch lessons
export const StepWithImageSchema = z.object({
  step: z.string().describe('The instruction text for this step'),
  imageSlot: ImageSlotSchema.nullable().default(null),
});
export const ScratchLessonSchema = ProgrammingLessonSchema.extend({
  lessonType: z.literal('block-based (scratch) lesson'),
  addYourCodeSection: z.array(StepWithImageSchema),
}); // LLM version of the same schema
const StepWithImageLLMSchema = StepWithImageSchema.omit({ imageSlot: true });
export const ScratchLessonLLMSchema = ScratchLessonSchema.extend({
  addYourCodeSection: z.array(StepWithImageLLMSchema).describe('Step-by-step coding instructions'),
}).omit({
  level: true,
  prefaceImageSlots: true,
});

// Dbugging lessons
export const DebugStepSchema = z.object({
  linkToCode: z.url().describe('URL link to the static content'),
  issue: z
    .string()
    .describe('The issue that must be fixed, preserve all original paragraph breaks and newlines'),
});
export const DebugLessonSchema = ProgrammingLessonSchema.extend({
  lessonType: z.literal('debugging lesson'),
  debugSection: z.array(DebugStepSchema).describe('Content found under the "Debug" headre'),
}).omit({
  projectExplainer: true,
  addYourCodeSection: true,
  tryItOutSection: true,
  challengeSection: true,
  newProject: true,
  testYourself: true,
  funFact: true,
}); // LLM version of the same schema
export const DebugLessonLLMSchema = DebugLessonSchema.omit({
  level: true,
  prefaceImageSlots: true,
});

export const LessonSchema = z.discriminatedUnion('lessonType', [
  ProgrammingLessonSchema,
  ScratchLessonSchema,
  DebugLessonSchema,
]);

// The fields that the LLM will not be able to see at all, when generating
// These are populated with rule based logic
const StandardLessonLLMSchemaNoType = StandardLessonLLMSchema.omit({
  lessonType: true,
}).describe(
  'Use this for text-based programming lessons (Python, JS, Java, etc.) that follow a standard "Add your code" and "Challenge" flow.'
);
const ScratchLessonLLMSchemaNoType = ScratchLessonLLMSchema.omit({
  lessonType: true,
}).describe(
  'Use this ONLY for Scratch/block-based lessons where instructions are tied to visual steps rather than raw code blocks.'
);
const DebugLessonLLMSchemaNoType = DebugLessonLLMSchema.omit({
  lessonType: true,
}).describe(
  'Use this for debugging exercises where the goal is to fix an existing issues rather than building one from scratch.'
);

export const LessonLLMSchema = z.union([
  StandardLessonLLMSchemaNoType,
  ScratchLessonLLMSchemaNoType,
  DebugLessonLLMSchemaNoType,
]);

export const LessonLLMSchemaWithoutLanguage = z.union([
  StandardLessonLLMSchemaNoType.omit({ programmingLanguage: true }),
  ScratchLessonLLMSchemaNoType.omit({ programmingLanguage: true }),
  DebugLessonLLMSchemaNoType.omit({ programmingLanguage: true }),
]);

// Inferred types from zod schemas
export type ProgrammingLanguage = z.infer<typeof languageEnum>;
export type LessonLevel = z.infer<typeof levelEnum>;
export type ImageSlot = z.infer<typeof ImageSlotSchema>;
export type StepWithImage = z.infer<typeof StepWithImageSchema>;
export type StepsWithCodeBlock = z.infer<typeof StepsWithCodeBlockSchema>;
export type Challenge = z.infer<typeof ChallengeSchema>;
export type NewProject = z.infer<typeof NewProjectSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type LessonLLM = z.infer<typeof LessonLLMSchema>;
