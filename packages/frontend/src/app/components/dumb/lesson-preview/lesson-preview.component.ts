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
      @page { size: A4; margin: 10mm; }
      body { font-family: 'Poppins'; }
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
