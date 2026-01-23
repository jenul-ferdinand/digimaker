import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Lesson } from '@digimakers/core/schemas';
import { LessonFormComponent } from '@components/dumb/lesson-form/lesson-form.component';
import { LessonPreviewComponent } from '@components/dumb/lesson-preview/lesson-preview.component';
import { sampleScratchLesson } from '@sample-data/scratch-lesson';
import { sampleJavaL5RandomnessRollDice, sampleJavaLesson } from '@sample-data/java-lesson';
import {
  sampleMultiSmallBasicLesson,
  sampleSmallBasicLesson3VariablesRGB,
} from '@sample-data/smallbasic-multi-lesson';

@Component({
  selector: 'app-live-editor',
  standalone: true,
  imports: [LessonFormComponent, LessonPreviewComponent],
  templateUrl: './live-editor.component.html',
  styleUrl: './live-editor.component.scss',
})
export class LiveEditorComponent {
  // Master State
  activeData: Lesson = this.getEmptyData();
  previewData: Lesson | null = null;

  // Debounce Stream
  private updateSubject = new Subject<Lesson>();

  ngOnInit() {
    this.loadInitialData();

    // The Magic: Wait 1 second after typing stops before updating PDF
    this.updateSubject.pipe(debounceTime(1000)).subscribe((freshData) => {
      console.log('Debounce finished. Rendering PDF...');
      this.previewData = freshData;
    });
  }

  // Called whenever the Dumb Form emits a change
  handleDataChange(newData: Lesson) {
    // 1. Update the form immediately (so inputs don't lag)
    this.activeData = newData;

    // 2. Queue the PDF update
    this.updateSubject.next(newData);
  }

  loadInitialData() {
    this.activeData = sampleSmallBasicLesson3VariablesRGB;

    this.previewData = { ...this.activeData };
  }

  getEmptyData(): Lesson {
    return {} as any; // simplified
  }
}
