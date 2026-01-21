// Removes extra new lines and stuff in code blocks
function reflowSingleLineCode(code: string): string {
  if (code.includes('\n') || code.length < 80) return code;

  return code
    .replace(/;\s*/g, ';\n')
    .replace(/{\s*/g, '{\n')
    .replace(/}\s*/g, '}\n')
    .replace(/\belse\b\s*/g, 'else\n');
}

export function normaliseCodeBlock(code: string | null): string | null {
  if (!code) return code;
  const hasRealNewlines = code.includes('\n');
  const hasEscapedNewlines = code.includes('\\n');
  const normalisedInput =
    !hasRealNewlines && hasEscapedNewlines ? code.replace(/\\n/g, '\n') : code;
  const reflowed = reflowSingleLineCode(normalisedInput);

  return reflowed
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
