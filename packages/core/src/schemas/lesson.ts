import { z } from 'zod';

export const StepWithImageSchema = z.object({
  step: z.string().describe('The instruction text for this step'),
  image: z.string().nullable().default(null).describe('Image reference if present, otherwise null'),
});

export const StepsWithCodeBlockSchema = z.object({
  codeBlock: z.string().describe('The code block that students have to write to get started'),
  steps: z
    .array(z.string())
    .describe(
      'The steps listed above the code block but below the "Add your code header", says "Main Program"'
    ),
});

export const ChallengeSchema = z.object({
  name: z
    .string()
    .describe('The name of the specific challenge, excluding the "- New Project" text'),
  task: z
    .string()
    .describe('The task for the challenge, explained as a requirement or feature to add'),
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
  projectImage: z
    .string()
    .nullable()
    .default(null)
    .describe('Reference to the main project image if present'),
  getReadySection: z
    .array(z.string())
    .describe('List of setup steps to prepare for the project (adding sprites, backdrops, etc.)'),
  addYourCodeSection: z.union([
    z
      .array(StepWithImageSchema)
      .describe('Step-by-step coding instructions, each step may have an associated image'),
    StepsWithCodeBlockSchema.describe('A block of code given with steps on what it does'),
  ]),
  codeBlock: z
    .string()
    .nullable()
    .default(null)
    .describe('A single code block if the lesson uses text-based code instead of visual blocks'),
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
    .describe('A link to the quiz, found under the "Test Yourself" header'),
  funFact: z
    .string()
    .nullable()
    .default(null)
    .describe('An interesting fact related to the lesson topic'),
});

// Inferred types - no manual interfaces needed!
export interface StepWithImage extends z.infer<typeof StepWithImageSchema> {};
export interface StepsWithCodeBlock extends z.infer<typeof StepsWithCodeBlockSchema> {};
export interface Challenge extends z.infer<typeof ChallengeSchema> {};
export interface NewProject extends z.infer<typeof NewProjectSchema> {};
export interface ParsedLesson extends z.infer<typeof ParsedLessonSchema> {};
