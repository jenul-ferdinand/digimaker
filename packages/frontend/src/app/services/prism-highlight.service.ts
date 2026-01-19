import { Injectable } from '@angular/core';
// @ts-expect-error
import Prism from 'prismjs';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-markup';

@Injectable({ providedIn: 'root' })
export class PrismHighlightService {
  normalizeLanguage(language?: string): string | null {
    if (!language) return null;
    const lower = language.toLowerCase().trim();
    if (lower === 'none') return null;
    if (lower === 'small-basic') return 'clike';
    if (lower === 'javascript or html or css') return 'markup';
    if (lower === 'c' || lower === 'java') return 'clike';
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
