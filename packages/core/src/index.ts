// Public API for @digimakers/core

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
