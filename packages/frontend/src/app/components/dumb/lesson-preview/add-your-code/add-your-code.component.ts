import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { StepWithImage, StepsWithCodeBlock } from '@digimakers/core';
// @ts-expect-error
import Prism from 'prismjs';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-clike';
import { PrismHighlightDirective } from '@directives/prism-highlight.directive';

@Component({
  selector: 'app-add-your-code',
  standalone: true,
  imports: [PrismHighlightDirective],
  styleUrl: './add-your-code.component.scss',
  templateUrl: './add-your-code.component.html',
})
export class AddYourCodeComponent {
  @ViewChild('codeBlock') codeBlock!: ElementRef;

  @Input({ required: true }) data!: StepWithImage[] | StepsWithCodeBlock;
  @Input({ required: true }) programmingLanguage!: string;

  get isStepWithImageArray(): boolean {
    return Array.isArray(this.data);
  }

  get stepsWithImages(): StepWithImage[] {
    return this.isStepWithImageArray ? (this.data as StepWithImage[]) : [];
  }

  get stepsWithCodeBlock(): StepsWithCodeBlock | null {
    return !this.isStepWithImageArray ? (this.data as StepsWithCodeBlock) : null;
  }
}
