# Lesson Sheet Template to Stylised PDF Converter

This project is a CLI tool to automate generation of Digimaker's lesson sheets, there are .docx templates that must be converted to stylised PDFs.

## README

@README.md

## How it's going to work.

- We have a Node.js CLI that starts a local file server of the built angular project `frontend/dist/index.html` on a rendom port for the few seconds it takes to generate the PDF. It will also launch a puppeteer instance to browse and download this PDF.

1. Start server once
2. Loop through .docx files to convert
   - Extract .docx text.
   - Open a new browser tab
   - Render angular template
   - Save PDF
   - Close tab
3. Shutdown

### Examples

You can see some examples of `.docx` templates and the corresponding converted/stylised PDF in `docs/example-templates` and `docs/example-outputs`.

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
