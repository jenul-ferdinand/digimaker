import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { StepWithImage, StepsWithCodeBlock } from '@digimakers/core';
// @ts-expect-error
import Prism from 'prismjs';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-clike';

@Component({
  selector: 'app-add-your-code',
  standalone: true,
  imports: [],
  styleUrl: './add-your-code.component.scss',
  templateUrl: './add-your-code.component.html',
})
export class AddYourCodeComponent implements AfterViewInit {
  @ViewChild('codeBlock') codeBlock!: ElementRef;

  @Input({ required: true }) data!: StepWithImage[] | StepsWithCodeBlock;

  get isStepWithImageArray(): boolean {
    return Array.isArray(this.data);
  }

  get stepsWithImages(): StepWithImage[] {
    return this.isStepWithImageArray ? (this.data as StepWithImage[]) : [];
  }

  get stepsWithCodeBlock(): StepsWithCodeBlock | null {
    return !this.isStepWithImageArray ? (this.data as StepsWithCodeBlock) : null;
  }

  ngAfterViewInit(): void {
    if (this.codeBlock?.nativeElement && this.stepsWithCodeBlock) {
      const codeEl = this.codeBlock.nativeElement;
      const code = codeEl.textContent || '';
      let language: string = this.stepsWithCodeBlock.codeBlockLanguage || 'none';
      if (language === 'small-basic') language = 'visual-basic';
      if (language === 'c' || language === 'java') language = 'clike';
      if (language === 'javascript or html or css') language = 'markup';
      if (language === 'none') {
        return;
      }
      codeEl.className = `language-${language}`;

      // Highlight code block using Prism
      const prismLanguage = Prism.languages[language];
      if (prismLanguage) {
        const highlighted = Prism.highlight(code, prismLanguage, language);
        codeEl.innerHTML = highlighted;
      }
    }
  }
}
