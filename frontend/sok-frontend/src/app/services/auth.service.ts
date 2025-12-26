import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: 'SUPER_ADMIN' | 'REVIEWER_VIEW' | 'REVIEWER_NOTE';
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = '/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadCurrentUser();
  }

  register(username: string, password: string, displayName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, {
      username,
      password,
      displayName
    });
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, {
      username,
      password
    }).pipe(
      tap(response => {
        localStorage.setItem('accessToken', response.accessToken);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        localStorage.removeItem('accessToken');
        this.currentUserSubject.next(null);
      })
    );
  }

  getCurrentUser(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.apiUrl}/auth/me`).pipe(
      tap(response => {
        this.currentUserSubject.next(response.user);
      })
    );
  }

  loadCurrentUser(): void {
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.getCurrentUser().subscribe({
        next: (response) => {
          this.currentUserSubject.next(response.user);
        },
        error: () => {
          // Try to refresh token if access token expired
          this.http.post<any>(`${this.apiUrl}/auth/refresh`, {}).subscribe({
            next: (refreshResponse) => {
              localStorage.setItem('accessToken', refreshResponse.accessToken);
              this.currentUserSubject.next(refreshResponse.user);
            },
            error: () => {
              localStorage.removeItem('accessToken');
              this.currentUserSubject.next(null);
            }
          });
        }
      });
    }
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isSuperAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'SUPER_ADMIN';
  }

  canAddNotes(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'SUPER_ADMIN' || user?.role === 'REVIEWER_NOTE';
  }

  updateProfile(username?: string, password?: string): Observable<{ message: string; user: User }> {
    const body: any = {};
    if (username) body.username = username;
    if (password) body.password = password;
    
    return this.http.patch<{ message: string; user: User }>(`${this.apiUrl}/auth/profile`, body).pipe(
      tap(response => {
        // Update current user in the service
        this.currentUserSubject.next(response.user);
      })
    );
  }
}

