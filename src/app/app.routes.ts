import { Routes } from '@angular/router';
import { DivisionListComponent } from './components/division-list/division-list.component';

export const routes: Routes = [
  { path: '', redirectTo: '/divisions', pathMatch: 'full' },
  { path: 'divisions', component: DivisionListComponent }
];