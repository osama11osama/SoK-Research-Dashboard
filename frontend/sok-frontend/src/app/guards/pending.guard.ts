import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const pendingGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If authenticated and approved, redirect to papers
  if (authService.isAuthenticated()) {
    authService.currentUser$.subscribe(user => {
      if (user) {
        router.navigate(['/app/papers']);
      }
    });
  }

  return true;
};

