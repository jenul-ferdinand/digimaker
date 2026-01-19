import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ParsedLesson } from '@digimakers/core';
import { LessonFormComponent } from '@components/dumb/lesson-form/lesson-form.component';
import { LessonPreviewComponent } from '@components/dumb/lesson-preview/lesson-preview.component';
import { sampleScratchLesson } from '@sample-data/scratch-lesson';
import { sampleJavaLesson } from '@sample-data/java-lesson';

@Component({
  selector: 'app-live-editor',
  standalone: true,
  imports: [LessonFormComponent, LessonPreviewComponent],
  templateUrl: './live-editor.component.html',
  styleUrl: './live-editor.component.scss',
})
export class LiveEditorComponent {
  // Master State
  activeData: ParsedLesson = this.getEmptyData();
  previewData: ParsedLesson | null = null;

  // Debounce Stream
  private updateSubject = new Subject<ParsedLesson>();

  ngOnInit() {
    this.loadInitialData();

    // The Magic: Wait 1 second after typing stops before updating PDF
    this.updateSubject.pipe(debounceTime(1000)).subscribe((freshData) => {
      console.log('Debounce finished. Rendering PDF...');
      this.previewData = freshData;
    });
  }

  // Called whenever the Dumb Form emits a change
  handleDataChange(newData: ParsedLesson) {
    // 1. Update the form immediately (so inputs don't lag)
    this.activeData = newData;

    // 2. Queue the PDF update
    this.updateSubject.next(newData);
  }

  loadInitialData() {
    this.activeData = sampleJavaLesson;

    this.previewData = { ...this.activeData };
  }

  getEmptyData(): ParsedLesson {
    return {} as any; // simplified
  }
}
