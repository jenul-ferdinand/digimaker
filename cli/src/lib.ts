// Public API for library usage
export { createPdfGenerator } from './pdf-generator.js';
export type { PdfGeneratorInstance } from './pdf-generator.js';
export { startServer, stopServer } from './server.js';
export type { ServerInstance } from './server.js';
export { logger } from './logger.js';

// Parsing
export { findDocxFiles, parseDocx } from './parsing/index.js';
export type { DiscoveryOptions, DiscoveredFile, ParseOptions, ParseResult } from './parsing/index.js';

// Re-export common types
export type { LessonData } from '@common-types/lesson';
export type { GenerateOptions } from '@common-types/generate';
