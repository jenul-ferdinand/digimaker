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

  splitOnSecondColon(step: string): { first: string; second: string | null } {
    let firstColon = -1;
    let secondColon = -1;
    for (let i = 0; i < step.length; i += 1) {
      if (step[i] === ':') {
        if (firstColon === -1) {
          firstColon = i;
        } else {
          secondColon = i;
          break;
        }
      }
    }

    if (secondColon === -1) {
      return { first: step, second: null };
    }

    const lastSpace = step.lastIndexOf(' ', secondColon);
    const splitIndex = lastSpace >= 0 ? lastSpace + 1 : 0;
    const first = step.slice(0, splitIndex).trimEnd();
    const second = step.slice(splitIndex).trimStart();
    return { first, second: second || null };
  }
}
