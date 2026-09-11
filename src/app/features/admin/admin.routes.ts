import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const adminRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage),
    canActivate: [authGuard],
    title: 'Panel — Consultorio del Amor',
  },
];