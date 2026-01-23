import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-fun-fact',
  standalone: true,
  imports: [],
  templateUrl: './fun-fact.component.html',
  styleUrl: './fun-fact.component.scss'
})
export class FunFactComponent {
  @Input({ required: true }) funFact!: string;
}
