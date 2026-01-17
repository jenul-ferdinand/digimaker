# Digimaker CLI 

- Converts .docx lesson sheets into stylised PDFs.

## How to use while developing
```pwsh
# Developing the frontend template design
cd frontend
ng serve

# Working with the CLI
cd cli
npm run dev -- generate                     # Run in development mode
npm run dev -- generate -f myfile           # Custom filename
npm run dev -- generate -o ./pdfs           # Custom output dir
npm run dev -- serve                        # Browser testing
npm run build                               # Build for production
```
Or you can use it as a library, see [library usage example code](./docs/library-usage/code.ts).

## Requirements

- [ ] R1: User's should be able to run this in a folder with lesson templates.
- [ ] R2: The system should parse content, converting it into data.
- [ ] R3: The system should output PDFs

## How it works

### Workflow

1. Parsing .docx file, extracting text content, code blocks, images, and structure into a clean data format (JSON/Dictionary).

2. Inject data into a prebuilt stylised HTML/CSS template.

3. Generate PDF

