import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const pendingGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If not authenticated, allow access to pending page
  if (!authService.isAuthenticated()) {
    return true;
  }

  // If authenticated (which means approved, since login only works for approved users),
  // redirect to papers page
  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (user) {
        router.navigate(['/app/papers']);
        return false; // Block access to pending page if authenticated/approved
      }
      return true; // Allow access if not authenticated
    })
  );
};

