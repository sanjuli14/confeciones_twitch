import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'enviar', renderMode: RenderMode.Prerender },
  { path: 'admin/login', renderMode: RenderMode.Client },
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'overlay', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];