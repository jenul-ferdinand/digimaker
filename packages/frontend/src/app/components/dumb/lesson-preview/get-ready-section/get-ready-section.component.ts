import { Component, Input } from '@angular/core';
import { ImageSlot } from '@digimakers/core/schemas';

@Component({
  selector: 'app-get-ready-section',
  standalone: true,
  imports: [],
  templateUrl: './get-ready-section.component.html',
  styleUrl: './get-ready-section.component.scss',
})
export class GetReadySectionComponent {
  @Input({ required: true }) getReadySectionData!: Array<string>;

  // Only takes one image, more than one is handled in parent
  @Input() imageSlot!: ImageSlot | null;
}
