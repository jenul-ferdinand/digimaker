import { Component, Input } from '@angular/core';

interface DebugStep {
  linkToCode: string;
  issue: string;
}

@Component({
  selector: 'app-debug-section',
  standalone: true,
  imports: [],
  templateUrl: './debug-section.component.html',
  styleUrl: './debug-section.component.scss',
})
export class DebugSectionComponent {
  @Input({ required: true }) debugSteps!: DebugStep[];
}
