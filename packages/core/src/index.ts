// Public API for @digimakers/core

// Schemas and types (single source of truth)
export {
  // Schemas
  StepWithImageSchema,
  StepsWithCodeBlockSchema,
  ChallengeSchema,
  NewProjectSchema,
  ParsedLessonSchema,
  GenerateOptionsSchema,
  // Types
  type StepWithImage,
  type StepsWithCodeBlock,
  type MultipleStepsWithCodeBlock,
  type Challenge,
  type NewProject,
  type ParsedLesson,
  type GenerateOptions,
} from './schemas/index.js';

// PDF generation
export { createPdfGenerator, convertWithConcurrency, POOL_SIZE } from './pdf-generator.js';
export type { PdfGeneratorInstance, FileToConvert, ConversionResult } from './pdf-generator.js';

// Server
export { startServer, stopServer } from './server.js';
export type { ServerInstance } from './server.js';

// Logger
export { logger } from './logger.js';

// Parsing
export { findDocxFiles, parseDocx } from './parsing/index.js';
export type { DiscoveryOptions, DiscoveredFile, ParseResult } from './parsing/index.js';

// Sample data (for testing)
export { sampleLessonData } from './sample-data.js';
