import { Injectable } from '@angular/core';
// @ts-expect-error
import Prism from 'prismjs';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-lua';

@Injectable({ providedIn: 'root' })
export class PrismHighlightService {
  normalizeLanguage(language?: string): string | null {
    if (!language) return null;
    const lower = language.toLowerCase().trim();

    switch (lower) {
      case 'none':
        return null;

      case 'small-basic':
      case 'c':
      case 'java':
        return 'clike';

      case 'javascript or html or css':
        return 'markup';

      case 'pygame':
        return 'python';
    }

    // Languages that just work by itself
    return lower;
  }

  highlight(codeEl: HTMLElement, code: string, language?: string): void {
    const normalized = this.normalizeLanguage(language);
    if (!normalized) {
      codeEl.textContent = code;
      return;
    }

    codeEl.className = `language-${normalized}`;
    const prismLanguage = Prism.languages[normalized];
    if (!prismLanguage) {
      codeEl.textContent = code;
      return;
    }

    codeEl.innerHTML = Prism.highlight(code, prismLanguage, normalized);
  }
}
