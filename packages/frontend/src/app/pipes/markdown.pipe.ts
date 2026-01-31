import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';

@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  constructor() {
    marked.setOptions({
      breaks: false,
      gfm: true,
    });
  }

  transform(value: string): string {
    if (!value) return '';
    return marked.parseInline(value) as string;
  }
}
