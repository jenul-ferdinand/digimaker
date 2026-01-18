import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-get-ready-section',
  standalone: true,
  imports: [],
  templateUrl: './get-ready-section.component.html',
  styleUrl: './get-ready-section.component.scss'
})
export class GetReadySectionComponent {
  @Input({ required: true }) getReadySectionData!: Array<string>;
  @Input({ required: true }) projectImage!: string;
}
