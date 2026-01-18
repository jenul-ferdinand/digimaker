import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { ParsedLesson } from '@digimaker/core';
import { LessonPreviewComponent } from '@components/dumb/lesson-preview/lesson-preview.component';

declare global {
  interface Window {
    PDF_DATA: ParsedLesson | null;
  }
}

@Component({
  selector: 'app-print',
  standalone: true,
  imports: [LessonPreviewComponent],
  templateUrl: './print.component.html',
  styleUrl: './print.component.scss',
})
export class PrintComponent implements OnInit, OnDestroy {
  data: ParsedLesson | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    // Add print-mode class to body for global styling overrides
    document.body.classList.add('print-mode');

    // Check for initial data
    if (window.PDF_DATA) {
      this.data = window.PDF_DATA;
    }

    // Poll for PDF_DATA changes (set by Puppeteer)
    this.pollInterval = setInterval(() => {
      const newData = window.PDF_DATA;
      if (newData !== this.data) {
        this.ngZone.run(() => {
          this.data = newData;
        });
      }
    }, 50);
  }

  ngOnDestroy(): void {
    // Remove print-mode class from body
    document.body.classList.remove('print-mode');

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}
