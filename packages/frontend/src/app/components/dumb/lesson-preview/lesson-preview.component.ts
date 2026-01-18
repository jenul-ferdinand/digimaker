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
import { ParsedLesson } from '@digimaker/core';
import { AddYourCodeComponent } from './add-your-code/add-your-code.component';
// @ts-expect-error
import { Previewer } from 'pagedjs';
import { TitleSectionComponent } from './title-section/title-section.component';
import { GetReadySectionComponent } from './get-ready-section/get-ready-section.component';

@Component({
  selector: 'app-lesson-preview',
  standalone: true,
  imports: [AddYourCodeComponent, TitleSectionComponent, GetReadySectionComponent],
  templateUrl: './lesson-preview.component.html',
  styleUrl: './lesson-preview.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class LessonPreviewComponent implements AfterViewInit, OnChanges {
  @Input() data: ParsedLesson | null = null;

  @ViewChild('sourceContent') sourceContent!: ElementRef;
  @ViewChild('previewContainer') previewContainer!: ElementRef;

  private viewReady = false;

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

    // Clear previous PDF
    this.previewContainer.nativeElement.innerHTML = '';

    // Page styles for Paged.js (component styles are global via SCSS)
    const pageStyles = `
      @page {
        size: A4;
        margin: 5mm;
      }
      body {
        font-family: 'Poppins';
      }
    `;

    // Run Paged.js
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
