import { Routes } from '@angular/router';
import { LiveEditorComponent } from './smart/live-editor/live-editor.component';
import { PrintComponent } from './smart/print/print.component';

export const routes: Routes = [
  { path: '', component: LiveEditorComponent },
  { path: 'print', component: PrintComponent },
];
