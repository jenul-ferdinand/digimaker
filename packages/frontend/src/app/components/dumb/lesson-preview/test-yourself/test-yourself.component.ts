import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-test-yourself',
  standalone: true,
  imports: [],
  templateUrl: './test-yourself.component.html',
  styleUrl: './test-yourself.component.scss',
})
export class TestYourselfComponent {
  @Input({ required: true }) testYourselfData!: string; // Should be a url
}
