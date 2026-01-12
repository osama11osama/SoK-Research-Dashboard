import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

export interface Notification {
  _id: string;
  userId: string;
  type: 'PUBLIC_NOTE' | 'PAPER_ADDED' | 'PAPER_EDITED' | 'MENTION';
  title: string;
  message: string;
  relatedPaperId?: {
    _id: string;
    title: string;
  };
  relatedNoteId?: {
    _id: string;
    content: string;
  };
  relatedUserId?: {
    _id: string;
    displayName: string;
    username: string;
  };
  read: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  publicNote: boolean;
  paperAdded: boolean;
  paperEdited: boolean;
  mention: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = '/api';

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    // Poll for unread count every 30 seconds
    interval(30000).pipe(
      startWith(0),
      switchMap(() => this.getUnreadCount())
    ).subscribe(count => {
      this.unreadCountSubject.next(count);
    });
  }

  getNotifications(): Observable<{ notifications: Notification[] }> {
    return this.http.get<{ notifications: Notification[] }>(`${this.apiUrl}/notifications`);
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/notifications/unread-count`).pipe(
      switchMap(response => {
        this.unreadCountSubject.next(response.count);
        return [response.count];
      })
    );
  }

  markAsRead(notificationId: string): Observable<{ notification: Notification }> {
    return this.http.patch<{ notification: Notification }>(
      `${this.apiUrl}/notifications/${notificationId}/read`,
      {}
    );
  }

  markAllAsRead(): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(
      `${this.apiUrl}/notifications/read-all`,
      {}
    );
  }

  deleteNotification(notificationId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/notifications/${notificationId}`
    );
  }

  getPreferences(): Observable<{ preferences: NotificationPreferences }> {
    return this.http.get<{ preferences: NotificationPreferences }>(
      `${this.apiUrl}/notifications/preferences`
    );
  }

  updatePreferences(preferences: Partial<NotificationPreferences>): Observable<{ preferences: NotificationPreferences }> {
    return this.http.patch<{ preferences: NotificationPreferences }>(
      `${this.apiUrl}/notifications/preferences`,
      preferences
    );
  }

  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe();
  }
}

