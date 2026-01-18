import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ParsedLesson, StepWithImage, StepsWithCodeBlock } from '@common-types/lesson';
// @ts-expect-error
import { Previewer } from 'pagedjs';

@Component({
  selector: 'app-lesson-preview',
  standalone: true,
  imports: [],
  templateUrl: './lesson-preview.component.html',
  styleUrl: './lesson-preview.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class LessonPreviewComponent implements AfterViewInit, OnChanges {
  @Input() data: ParsedLesson | null = null;

  @ViewChild('sourceContent') sourceContent!: ElementRef;
  @ViewChild('previewContainer') previewContainer!: ElementRef;

  private viewReady = false;

  // Type guards for addYourCodeSection union type
  get isStepWithImageArray(): boolean {
    return Array.isArray(this.data?.addYourCodeSection);
  }

  get stepsWithImages(): StepWithImage[] {
    return this.isStepWithImageArray ? (this.data!.addYourCodeSection as StepWithImage[]) : [];
  }

  get stepsWithCodeBlock(): StepsWithCodeBlock | null {
    return !this.isStepWithImageArray ? (this.data!.addYourCodeSection as StepsWithCodeBlock) : null;
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    // Render if data was already set before view init
    if (this.data) {
      this.render();
    }
  }

  // Detect when parent updates data
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data && this.viewReady) {
      // Trigger render, but wait for DOM to update first
      setTimeout(() => this.render(), 100);
    }
  }

  async render() {
    if (!this.sourceContent || !this.previewContainer) return;

    // Signal that rendering has started (for Puppeteer)
    (window as any)['PAGED_READY'] = false;

    // 1. Clear previous PDF
    this.previewContainer.nativeElement.innerHTML = '';

    // 2. Define page styles for Paged.js
    const pageStyles = `
      @page {
        size: A4;
        margin: 15mm;
      }
      body {
        font-family: sans-serif;
      }
    `;

    // 3. Run Paged.js with styles
    const paged = new Previewer();
    await paged.preview(
      this.sourceContent.nativeElement.innerHTML,
      [{ type: 'text/css', content: pageStyles }],
      this.previewContainer.nativeElement
    );

    // Signal that rendering is complete (for Puppeteer)
    (window as any)['PAGED_READY'] = true;
  }
}
