import { Component, Input } from '@angular/core';
import { StepWithImage, StepsWithCodeBlock } from '@digimakers/core/schemas';
import { PrismHighlightDirective } from '@directives/prism-highlight.directive';

@Component({
  selector: 'app-add-your-code',
  standalone: true,
  imports: [PrismHighlightDirective],
  styleUrl: './add-your-code.component.scss',
  templateUrl: './add-your-code.component.html',
})
export class AddYourCodeComponent {
  @Input({ required: true }) data!:
    | StepWithImage[]
    | StepsWithCodeBlock[]
    | null;
  @Input({ required: true }) programmingLanguage!: string;

  get isStepWithImage(): boolean {
    return Array.isArray(this.data) && this.data.every((item) => 'step' in item);
  }

  get stepsWithImages(): StepWithImage[] {
    return this.isStepWithImage ? (this.data as StepWithImage[]) : [];
  }

  get isStepsWithCodeBlockArray(): boolean {
    return Array.isArray(this.data) && this.data.every((item) => 'steps' in item);
  }

  get stepsWithCodeBlockArray(): StepsWithCodeBlock[] {
    return this.isStepsWithCodeBlockArray ? (this.data as StepsWithCodeBlock[]) : [];
  }
}
