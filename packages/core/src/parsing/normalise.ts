// Removes extra new lines and stuff in code blocks
export function normaliseCodeBlock(code: string | null): string | null {
  if (!code) return code;
  return code
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/g, ''))
    .join('\n')
    .replace(/\n{2,}/g, '\n');
}

export function normaliseText(text: string | null): string | null {
  if (!text) return text;
  return text
    .replace(/```(?:\w+)?/g, '')
    .replace(/<\/?code>/g, '')
    .trim();
}
