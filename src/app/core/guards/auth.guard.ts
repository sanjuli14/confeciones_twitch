import { inject } from '@angular/core';
import { CanMatchFn, UrlTree, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanMatchFn = async (): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);
  try {
    if (!auth.initialized()) await auth.ensureSession();
    return auth.user() ? true : router.createUrlTree(['/admin/login']);
  } catch {
    return router.createUrlTree(['/admin/login']);
  }
};