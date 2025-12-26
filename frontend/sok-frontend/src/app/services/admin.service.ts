import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminUser {
  _id: string;
  username: string;
  displayName: string;
  role: 'SUPER_ADMIN' | 'REVIEWER_VIEW' | 'REVIEWER_NOTE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED';
  createdAt: string;
  approvedAt?: string;
  approvedByUserId?: string;
}

export interface UsersResponse {
  users: AdminUser[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = '/api';

  getUsers(status?: string): Observable<UsersResponse> {
    if (status) {
      return this.http.get<UsersResponse>(`${this.apiUrl}/admin/users`, { params: { status } });
    } else {
      return this.http.get<UsersResponse>(`${this.apiUrl}/admin/users`);
    }
  }

  getUser(id: string): Observable<{ user: AdminUser }> {
    return this.http.get<{ user: AdminUser }>(`${this.apiUrl}/admin/users/${id}`);
  }

  approveUser(id: string, role: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/users/${id}/approve`, { role });
  }

  rejectUser(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/users/${id}/reject`, {});
  }

  disableUser(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/users/${id}/disable`, {});
  }

  updateUserRole(id: string, role: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/users/${id}/role`, { role });
  }
}

