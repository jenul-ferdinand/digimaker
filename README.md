# @digimakers/{core,cli,server,frontend}

Monorepo for digimaker's code, the main thing here right now is the .docx lesson parser that also converts them to new stylised PDFs.

## How it works

### Workflow

We first parse .docx files, extracting text content, code blocks, images, and structure into a clean data format (JSON). AI is used to process text with zod object validation to get content from the word documents. So developers, make sure `GEMINI_API_KEY` is set in `packages/cli/.env`.

Multiple workers are spawned for each .docx file and data is then injected into a prebuilt stylised HTML/CSS template (Angular + Paged.js). There is a `/print` route in this frontend that puppeteer navigates and injects data into. Finally, once data is injected, the stylised lesson PDFs are generated and outputted.

### Code and the sources of truth

Check `packages/core` this is the source of truth and where the important stuff is, this package exports code so that the CLI, Server, and Frontend can all use types/functions from it.

## Requirements

### System requirements

- [x] SR1: The system should parse content, converting it into data.
- [x] SR2: The system should output PDFs

### User requirements

- [ ] UR1: Users should be able to run this in a folder with lesson templates.
- [ ] UR2: Users should be able to download this easily through an install script or similar.
- [ ] UR3: Users can easily use this CLI tool because it guides the user on what to do.

### Out-of-scope requirements

- [ ] OR1: The CLI tool has a terminal user interface.
- [ ] OR2: A backend server is hosted that provides .docx upload and spits out lesson PDFs.

## Project Structure

This is a monorepo with the following packages:

```
packages/
├── core/       # Core library - schemas, parsing, PDF generation (TARGET)
├── cli/        # CLI tool wrapper (target feature by term 1 start)
├── server/     # Express API server (to be decided / in progress)
└── frontend/   # Angular template for PDF rendering (TARGET)
```

## User Installation

- macOS / Linux / WSL: `curl -fsSL https://raw.githubusercontent.com/jenul-ferdinand/digimaker/main/install.sh | bash`

- Windows PowerShell: `irm https://raw.githubusercontent.com/jenul-ferdinand/digimaker/main/install.ps1 | iex`

- Or directly via npm: `npm install -g @digimakers/cli`

## Developer Information

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

# Converting real .docx files (outputed in `packages/cli/output`)
npm run dev:cli -- convert "../../docs/example-templates/Lesson 4 - Decisions_CrossyRoad.docx"
# You can provide optional output path with the --output flag.

# Working with the CLI (no input, faked for testing)
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
  type Lesson,
} from '@digimakers/core';

// Start server, create generator, generate PDFs...
```

See [library usage example](./docs/library-usage/code.ts) for full example.

## Attributions

Icons by [littleicons](https://www.flaticon.com/authors/littleicon), [Freepik](https://www.flaticon.com/authors/freepik), and [judanna](https://www.flaticon.com/authors/judanna) from [www.flaticon.com](www.flaticon.com)
