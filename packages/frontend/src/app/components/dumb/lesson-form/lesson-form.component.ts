import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Lesson } from '@digimakers/core/schemas';

type ArrayKeys<T> = {
  [K in keyof T]: T[K] extends any[] ? K : never;
}[keyof T];

@Component({
  selector: 'app-lesson-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './lesson-form.component.html',
  styleUrl: './lesson-form.component.scss',
})
export class LessonFormComponent {
  @Input({ required: true }) data!: Lesson;

  // Output: Emit the WHOLE object back up whenever a single field changes
  @Output() dataChange = new EventEmitter<Lesson>();

  updateField(field: string, value: any) {
    const updated = { ...this.data, [field]: value } as Lesson;
    this.dataChange.emit(updated);
  }

  onUpdateStepSection(key: string, index: number, newValue: any) {
    const currentValue = this.data[key as keyof Lesson];
    if (!Array.isArray(currentValue)) return;
    const updatedArray = [...currentValue];
    updatedArray[index] = newValue;
    this.updateField(key, updatedArray);
  }
}
