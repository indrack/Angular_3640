import { Routes } from '@angular/router';
import { TvContainerComponent } from './features/tv-display/tv-container.component';
import { AdminComponent } from './features/admin/admin.component';

export const routes: Routes = [
  { path: '', component: TvContainerComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '' }
];
