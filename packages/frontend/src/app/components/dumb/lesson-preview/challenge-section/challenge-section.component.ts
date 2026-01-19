import { Component, Input } from '@angular/core';
import { Challenge } from '@digimakers/core';
import { PrismHighlightDirective } from '@directives/prism-highlight.directive';

@Component({
  selector: 'app-challenge-section',
  standalone: true,
  imports: [PrismHighlightDirective],
  templateUrl: './challenge-section.component.html',
  styleUrl: './challenge-section.component.scss',
})
export class ChallengeSectionComponent {
  @Input({ required: true }) challenges!: Challenge[];
  @Input({ required: true }) programmingLanguage!: string;
}
