import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if token exists
  // The AuthService constructor already calls loadCurrentUser() which will
  // attempt to load/refresh the user. If token is invalid, API calls will return 401
  // and we'll handle that in the interceptor or component error handlers.
  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Token exists - allow access
  return true;
};
