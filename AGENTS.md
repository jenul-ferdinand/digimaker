# Lesson Sheet Template to Stylised PDF Converter

This project is a CLI tool to convert Digimaker lesson .docx templates into
stylised PDFs using a Node.js pipeline + Angular frontend.

## README

@README.md

## Current Flow

- CLI starts a local static server for the built Angular app and launches
  Puppeteer to render PDFs.
- Parsing prefers docling markdown, falls back to mammoth raw text.
- LLM extracts structured lesson data, then post-processing:
  - Assigns images to placeholders.
  - Infers lessonType (no lessonType required in LLM output).
  - Optionally overrides programmingLanguage from footer.

1) Start server once
2) Loop through .docx files:
   - Extract docling markdown + images
   - LLM -> structured lesson object
   - Post-process (images, lessonType, language)
   - Render Angular template in a fresh tab
   - Save PDF
   - Close tab
3) Shutdown

## Lesson Types

- text-based (programming) lesson
- block-based (scratch) lesson
- debugging lesson

## Examples / Outputs

- Input templates: `docs/example-templates`
- Generated PDFs and PNG renders:
  `packages/cli/output`

## Notes for Debugging

- CLI arguments must be passed after `--`:
  `npm run dev:cli -- convert ./docs/example-templates -- --concurrency=1`
- Frontend static path is resolved in `packages/core/src/server.ts`.

## Playwright MCP Integration

### Essential Commands for UI Testing

```javascript
// Navigation & Screenshots
mcp__playwright__browser_navigate(url); // Navigate to page
mcp__playwright__browser_take_screenshot(); // Capture visual evidence
mcp__playwright__browser_resize(width, height); // Test responsiveness

// Interaction Testing
mcp__playwright__browser_click(element); // Test clicks
mcp__playwright__browser_type(element, text); // Test input
mcp__playwright__browser_hover(element); // Test hover states

// Validation
mcp__playwright__browser_console_messages(); // Check for errors
mcp__playwright__browser_snapshot(); // Accessibility check
mcp__playwright__browser_wait_for(text / element); // Ensure loading
```
