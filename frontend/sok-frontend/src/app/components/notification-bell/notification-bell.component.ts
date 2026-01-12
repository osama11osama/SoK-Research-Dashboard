import { Component, OnInit, OnDestroy, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NotificationService, Notification } from '../../services/notification.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css'
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private destroy$ = new Subject<void>();
  private elementRef = inject(ElementRef);

  notifications: Notification[] = [];
  unreadCount = 0;
  showDropdown = false;
  loading = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.showDropdown && !this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  ngOnInit() {
    this.loadNotifications();
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });
    this.notificationService.refreshUnreadCount();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications() {
    this.loading = true;
    this.notificationService.getNotifications().subscribe({
      next: (response) => {
        this.notifications = response.notifications;
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load notifications:', err);
        this.loading = false;
      }
    });
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.loadNotifications();
    }
  }

  markAsRead(notification: Notification) {
    if (notification.read) return;

    this.notificationService.markAsRead(notification._id).subscribe({
      next: () => {
        notification.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.notificationService.refreshUnreadCount();
      },
      error: (err) => {
        console.error('Failed to mark notification as read:', err);
      }
    });
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.read = true);
        this.unreadCount = 0;
        this.notificationService.refreshUnreadCount();
        this.toastr.success('All notifications marked as read');
      },
      error: (err) => {
        console.error('Failed to mark all as read:', err);
        this.toastr.error('Failed to mark all as read');
      }
    });
  }

  deleteNotification(notification: Notification, event: Event) {
    event.stopPropagation();
    this.notificationService.deleteNotification(notification._id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n._id !== notification._id);
        if (!notification.read) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
        this.notificationService.refreshUnreadCount();
      },
      error: (err) => {
        console.error('Failed to delete notification:', err);
        this.toastr.error('Failed to delete notification');
      }
    });
  }

  handleNotificationClick(notification: Notification) {
    this.markAsRead(notification);
    
    // Get paper ID - handle both object and string formats
    let paperId: string | null = null;
    if (notification.relatedPaperId) {
      if (typeof notification.relatedPaperId === 'string') {
        paperId = notification.relatedPaperId;
      } else if (notification.relatedPaperId._id) {
        paperId = notification.relatedPaperId._id;
      }
    }
    
    if (paperId) {
      // Close dropdown first
      this.showDropdown = false;
      
      // Check current route
      const currentUrl = this.router.url;
      const targetUrl = `/app/papers/${paperId}`;
      
      if (currentUrl === targetUrl) {
        // Already on the same page - force reload by navigating away and back
        this.router.navigate(['/app/papers']).then(() => {
          setTimeout(() => {
            this.router.navigate(['/app/papers', paperId]);
          }, 100);
        });
      } else {
        // Navigate to the paper - force navigation even if on same route pattern
        this.router.navigateByUrl(targetUrl, { skipLocationChange: false }).catch(err => {
          console.error('Navigation error:', err);
          // Fallback: use window.location for hard navigation
          window.location.href = targetUrl;
        });
      }
    } else {
      // If no paper ID, just close the dropdown
      this.showDropdown = false;
      console.warn('Notification has no relatedPaperId:', notification);
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'PUBLIC_NOTE':
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case 'PAPER_ADDED':
        return 'M12 4v16m8-8H4';
      case 'PAPER_EDITED':
        return 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z';
      case 'MENTION':
        return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
      default:
        return 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9';
    }
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  onNotificationMouseEnter(event: MouseEvent, notification: Notification) {
    const element = event.currentTarget as HTMLElement;
    if (element) {
      element.style.backgroundColor = 'var(--bg-tertiary)';
    }
  }

  onNotificationMouseLeave(event: MouseEvent, notification: Notification) {
    const element = event.currentTarget as HTMLElement;
    if (element) {
      element.style.backgroundColor = !notification.read ? 'var(--accent-primary)' : 'transparent';
      element.style.opacity = !notification.read ? '0.1' : '1';
    }
  }
}

