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

/**
 * Convert \n to real newlines only outside of string literals.
 * Preserves \n inside single or double quoted strings.
 */
function convertEscapedNewlinesOutsideStrings(code: string): string {
  let result = '';
  let inString: '"' | "'" | null = null;
  let i = 0;

  while (i < code.length) {
    const char = code[i];
    const nextChar = code[i + 1];

    // Check for escaped characters inside strings (skip them)
    if (inString && char === '\\' && nextChar) {
      result += char + nextChar;
      i += 2;
      continue;
    }

    // Toggle string state on unescaped quotes
    if ((char === '"' || char === "'") && !inString) {
      inString = char;
      result += char;
      i++;
      continue;
    }
    if (char === inString) {
      inString = null;
      result += char;
      i++;
      continue;
    }

    // Convert \n to real newline only outside strings
    if (!inString && char === '\\' && nextChar === 'n') {
      result += '\n';
      i += 2;
      continue;
    }

    result += char;
    i++;
  }

  return result;
}

export function normaliseCodeBlock(code: string | null): string | null {
  if (!code) return code;
  const hasRealNewlines = code.includes('\n');
  const hasEscapedNewlines = code.includes('\\n');
  const normalisedInput =
    !hasRealNewlines && hasEscapedNewlines ? convertEscapedNewlinesOutsideStrings(code) : code;
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
