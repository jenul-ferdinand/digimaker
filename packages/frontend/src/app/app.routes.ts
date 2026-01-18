import { Routes } from '@angular/router';
import { LiveEditorComponent } from '@components/smart/live-editor/live-editor.component';
import { PrintComponent } from '@components/smart/print/print.component';

export const routes: Routes = [
  { path: '', component: LiveEditorComponent },
  { path: 'print', component: PrintComponent },
];
