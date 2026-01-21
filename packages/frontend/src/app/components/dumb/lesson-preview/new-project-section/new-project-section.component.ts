import { Component, Input } from '@angular/core';
import { NewProject } from '@digimakers/core/schemas';

@Component({
  selector: 'app-new-project-section',
  standalone: true,
  imports: [],
  templateUrl: './new-project-section.component.html',
  styleUrl: './new-project-section.component.scss',
})
export class NewProjectSectionComponent {
  @Input({ required: true }) newProject!: NewProject;
}
