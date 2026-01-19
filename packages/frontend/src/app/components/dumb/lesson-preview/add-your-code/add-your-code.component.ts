import { Component, Input } from '@angular/core';
import { StepWithImage, StepsWithCodeBlock, MultipleStepsWithCodeBlock } from '@digimakers/core';
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
    | StepsWithCodeBlock
    | MultipleStepsWithCodeBlock;
  @Input({ required: true }) programmingLanguage!: string;

  get isStepWithImage(): boolean {
    return Array.isArray(this.data) && this.data.every((item) => 'step' in item);
  }

  get isMultipleStepsWithCodeBlock(): boolean {
    return Array.isArray(this.data) && this.data.every((item) => 'steps' in item);
  }

  get isStepsWithOneCodeBlock(): boolean {
    return !Array.isArray(this.data) && this.data !== null && 'steps' in this.data;
  }

  get stepsWithImages(): StepWithImage[] {
    return this.isStepWithImage ? (this.data as StepWithImage[]) : [];
  }

  get stepsWithCodeBlock(): StepsWithCodeBlock | null {
    return this.isStepsWithOneCodeBlock ? (this.data as StepsWithCodeBlock) : null;
  }

  get multipleStepsWithCodeBlock(): MultipleStepsWithCodeBlock {
    return this.isMultipleStepsWithCodeBlock ? (this.data as MultipleStepsWithCodeBlock) : [];
  }
}
