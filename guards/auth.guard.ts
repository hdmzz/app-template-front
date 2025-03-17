import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../src/app/services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  const isAuthenticated = await authService.refreshSession();
  
  if (isAuthenticated) {
    return true;
  }
  router.navigate(['/login'], { queryParams: { returnUrl: state.url }});
  return false;
};
