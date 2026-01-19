import { AfterViewInit, Directive, ElementRef, Input, OnChanges } from '@angular/core';
import { PrismHighlightService } from '@services/prism-highlight.service';

@Directive({
  selector: '[prismHighlight]',
  standalone: true,
})
export class PrismHighlightDirective implements AfterViewInit, OnChanges {
  @Input() code: string | null = null;
  @Input() language: string | null = null;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private prism: PrismHighlightService
  ) {}

  ngAfterViewInit(): void {
    this.applyHighlight();
  }

  ngOnChanges(): void {
    this.applyHighlight();
  }

  private applyHighlight(): void {
    const codeEl = this.elementRef.nativeElement;
    const code = this.code ?? '';
    this.prism.highlight(codeEl, code, this.language ?? undefined);
  }
}
