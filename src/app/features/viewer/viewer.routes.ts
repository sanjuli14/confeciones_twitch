import { Routes } from '@angular/router';

export const viewerRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/submit/submit.page').then((m) => m.SubmitPage),
    title: 'Enviar confesión — Consultorio del Amor',
  },
];