import { Component, Input } from '@angular/core';
import { MarkdownPipe } from 'app/pipes/markdown.pipe';

@Component({
  selector: 'app-fun-fact',
  standalone: true,
  imports: [MarkdownPipe],
  templateUrl: './fun-fact.component.html',
  styleUrl: './fun-fact.component.scss',
})
export class FunFactComponent {
  @Input({ required: true }) funFact!: string;
}
