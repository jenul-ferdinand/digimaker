import { Component, Input } from '@angular/core';
import { MarkdownPipe } from '../../../../pipes/markdown.pipe';

@Component({
  selector: 'app-title-section',
  standalone: true,
  imports: [MarkdownPipe],
  templateUrl: './title-section.component.html',
  styleUrl: './title-section.component.scss',
})
export class TitleSectionComponent {
  @Input({ required: true }) topic!: string;
  @Input({ required: true }) project!: string;
  @Input({ required: true }) description!: string;
}
