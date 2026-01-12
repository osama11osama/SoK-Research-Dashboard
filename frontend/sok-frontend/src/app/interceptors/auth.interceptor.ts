import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Skip token for auth endpoints (login, register, refresh)
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  // Add token to request
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        // Try to refresh the token
        return authService.refreshToken().pipe(
          switchMap((refreshResponse) => {
            // Retry the original request with new token
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${refreshResponse.accessToken}`
              }
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            // Refresh failed, logout and redirect to login
            authService.logout().subscribe({
              next: () => {
                router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
              },
              error: () => {
                router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
              }
            });
            return throwError(() => refreshError);
          })
        );
      }
      
      return throwError(() => error);
    })
  );
};

