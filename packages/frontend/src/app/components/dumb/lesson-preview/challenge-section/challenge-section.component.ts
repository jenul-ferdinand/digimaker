import { Component, Input } from '@angular/core';
import { Challenge } from '@digimakers/core';

@Component({
  selector: 'app-challenge-section',
  standalone: true,
  imports: [],
  templateUrl: './challenge-section.component.html',
  styleUrl: './challenge-section.component.scss',
})
export class ChallengeSectionComponent {
  @Input({ required: true }) challenges!: Challenge[];
}
