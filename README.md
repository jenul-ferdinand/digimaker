# Digimaker CLI

Converts .docx lesson sheets into stylised PDFs.

## Project Structure

This is a monorepo with the following packages:

```
packages/
├── core/       # Core library - schemas, parsing, PDF generation
├── cli/        # CLI tool wrapper
├── server/     # Express API server
└── frontend/   # Angular template for PDF rendering
```

## Getting Started

```bash
# Install all dependencies
npm install

# Build all packages
npm run build
```

## Development

```bash
# Developing the frontend template design
npm run dev:frontend

# Working with the CLI
npm run dev:cli -- generate                     # Run in development mode
npm run dev:cli -- generate -f myfile           # Custom filename
npm run dev:cli -- generate -o ./pdfs           # Custom output dir
npm run dev:cli -- serve                        # Browser testing
```

## Using as a Library

```typescript
import {
  createPdfGenerator,
  startServer,
  stopServer,
  parseDocx,
  type ParsedLesson,
} from '@digimaker/core';

// Start server, create generator, generate PDFs...
```

See [library usage example](./docs/library-usage/code.ts) for full example.

## Requirements

- [ ] R1: Users should be able to run this in a folder with lesson templates.
- [ ] R2: The system should parse content, converting it into data.
- [ ] R3: The system should output PDFs

## How it works

### Workflow

1. Parse .docx file, extracting text content, code blocks, images, and structure into a clean data format (JSON).

2. Inject data into a prebuilt stylised HTML/CSS template (Angular + Paged.js).

3. Generate PDF using Puppeteer.
