// Removes extra new lines and stuff in code blocks
function reflowSingleLineCode(code: string): string {
  if (code.includes('\n') || code.length < 80) return code;

  let reflowed = code
    .replace(/;\s*/g, ';\n')
    .replace(/{\s*/g, '{\n')
    .replace(/}\s*/g, '}\n')
    .replace(/\belse\b\s*/g, 'else\n');

  if (
    !reflowed.includes('\n') &&
    /\b(for|if|while|def|class)\b/.test(reflowed) &&
    !/https?:\/\//i.test(reflowed)
  ) {
    reflowed = reflowed.replace(/:\s*/g, ':\n');
  }

  if (!reflowed.includes('\n') && /GraphicsWindow\./.test(reflowed)) {
    reflowed = reflowed.replace(/GraphicsWindow\./g, '\nGraphicsWindow.').trim();
  }

  if (
    !reflowed.includes('\n') &&
    /(\bfor\b|\bif\b|\bwhile\b|\bdef\b|\bclass\b|\belif\b|\belse\b)/.test(reflowed)
  ) {
    reflowed = reflowed.replace(
      /(\bfor\b|\bif\b|\bwhile\b|\bdef\b|\bclass\b|\belif\b|\belse\b)/g,
      '\n$1'
    );
  }

  if (!reflowed.includes('\n') && /(System\.out|printf\(|println\()/.test(reflowed)) {
    reflowed = reflowed
      .replace(/System\.out/g, '\nSystem.out')
      .replace(/printf\(/g, '\nprintf(')
      .replace(/println\(/g, '\nprintln(');
  }

  return reflowed;
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
