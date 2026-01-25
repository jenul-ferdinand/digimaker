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
import { Lesson } from '@digimakers/core/schemas';
import { AddYourCodeComponent } from './add-your-code/add-your-code.component';
// @ts-expect-error
import { Previewer } from 'pagedjs';
import { TitleSectionComponent } from './title-section/title-section.component';
import { GetReadySectionComponent } from './get-ready-section/get-ready-section.component';
import { ChallengeSectionComponent } from './challenge-section/challenge-section.component';
import { NewProjectSectionComponent } from './new-project-section/new-project-section.component';
import { TestYourselfComponent } from './test-yourself/test-yourself.component';
import { TryItOutComponent } from './try-it-out/try-it-out.component';
import { DebugSectionComponent } from './debug-section/debug-section.component';
import { FunFactComponent } from './fun-fact/fun-fact.component';

const JAVASCRIPT_ALIASES = new Set(['javascript or html or css', 'javascript', 'html', 'css']);
const SUPPORTED_LANGUAGE_BADGES = new Set(['scratch', 'small-basic', 'python', 'java', 'c']);

@Component({
  selector: 'app-lesson-preview',
  standalone: true,
  imports: [
    AddYourCodeComponent,
    TitleSectionComponent,
    GetReadySectionComponent,
    ChallengeSectionComponent,
    NewProjectSectionComponent,
    TestYourselfComponent,
    TryItOutComponent,
    DebugSectionComponent,
    FunFactComponent,
  ],
  templateUrl: './lesson-preview.component.html',
  styleUrl: './lesson-preview.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class LessonPreviewComponent implements AfterViewInit, OnChanges {
  @Input() data: Lesson | null = null;

  @ViewChild('sourceContent') sourceContent!: ElementRef;
  @ViewChild('previewContainer') previewContainer!: ElementRef;

  private viewReady = false;

  get languageBadgeSrc(): string | null {
    const raw = this.data?.programmingLanguage;
    if (!raw) return null;
    const normalized = raw.toLowerCase().trim();
    if (normalized === 'none') return null;
    if (JAVASCRIPT_ALIASES.has(normalized)) {
      return 'langs/javascript.png';
    }
    if (!SUPPORTED_LANGUAGE_BADGES.has(normalized)) return null;
    return `langs/${normalized}.png`;
  }

  get languageBadgeAlt(): string {
    const raw = this.data?.programmingLanguage;
    if (!raw) return '';
    const normalized = raw.toLowerCase().trim();
    if (normalized === 'none') return '';
    if (JAVASCRIPT_ALIASES.has(normalized)) {
      return 'JavaScript';
    }
    return raw;
  }

  get levelBadgeSrc(): string | null {
    const level = this.data?.level;
    if (level === 1) return 'level1.png';
    if (level === 2) return 'level2.png';
    return null;
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

    const renderToken = (window as any)['RENDER_TOKEN'];
    this.previewContainer.nativeElement.innerHTML = '';

    const pageStyles = `
      @page {
        size: A4;
        margin: 42mm 10mm 10mm;
        @bottom-center {
          content: counter(page) " / " counter(pages);
          font-size: 12pt;
          color: #666;
        }
      }
      body { font-family: 'Poppins'; box-sizing: border-box; }
      header.lesson-preview-header {
        position: fixed;
        top: 5mm;
        left: 10mm;
        right: 10mm;
        z-index: 10;
      }
      .preface-section {
        margin-top: 5cm;
      }

      app-get-ready-section {
        break-before: page;
      }

      app-challenge-section {
        break-before: page;
      }
      app-new-project-section {
        margin-top: 5mm;
      }

      app-test-yourself {
        break-before: page;
      }
    `;

    const paged = new Previewer();
    await paged.preview(
      this.sourceContent.nativeElement.innerHTML,
      [{ type: 'text/css', content: pageStyles }],
      this.previewContainer.nativeElement
    );

    if (renderToken !== undefined) {
      (window as any)['RENDER_DONE_TOKEN'] = renderToken;
    }
  }
}
