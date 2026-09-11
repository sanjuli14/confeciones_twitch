import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/enviar', pathMatch: 'full' },
  {
    path: 'enviar',
    loadChildren: () => import('./features/viewer/viewer.routes').then((m) => m.viewerRoutes),
    title: 'Enviar confesión — Consultorio del Amor',
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/pages/login/login.page').then((m) => m.LoginPage),
    title: 'Panel — Iniciar sesión',
  },
  {
    path: 'admin',
    canMatch: [authGuard],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
    title: 'Panel — Consultorio del Amor',
  },
  {
    path: 'overlay',
    loadComponent: () => import('./features/overlay/overlay.page').then((m) => m.OverlayPage),
    title: 'Overlay — Consultorio del Amor',
  },
  { path: '**', redirectTo: '/enviar' },
];