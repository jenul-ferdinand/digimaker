import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-try-it-out',
  standalone: true,
  imports: [],
  templateUrl: './try-it-out.component.html',
  styleUrl: './try-it-out.component.scss',
})
export class TryItOutComponent {
  @Input({ required: true }) tryItOutData!: Array<string>;
}
