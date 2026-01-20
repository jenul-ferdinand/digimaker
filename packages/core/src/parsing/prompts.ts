export const buildDocxParserPrompt = (textForLLM: string) => {
  return `Extract structured lesson data from this educational document.

This is a programming lesson sheet for students. Extract all the relevant sections and content.

If a section is not present in the document, use empty arrays for array fields, empty strings for required string fields, and null for nullable fields.

Ensure that code blocks are correctly formatted, the document below may not have correct formatting for code, you must reason and correctly format code blocks.

Document content:
${textForLLM}`;
};