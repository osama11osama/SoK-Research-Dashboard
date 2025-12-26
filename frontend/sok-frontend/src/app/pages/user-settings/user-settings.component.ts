import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './user-settings.component.html',
  styleUrl: './user-settings.component.css'
})
export class UserSettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private adminService = inject(AdminService);
  private toastr = inject(ToastrService);
  private router = inject(Router);

  currentUser$ = this.authService.currentUser$;
  
  username = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  
  // For SUPER_ADMIN: manage other users
  allUsers: any[] = [];
  selectedUserId: string | null = null;
  selectedUserPassword = '';
  showUserPasswordModal = false;

  ngOnInit() {
    this.loadCurrentUser();
    if (this.isSuperAdmin()) {
      this.loadAllUsers();
    }
  }

  loadCurrentUser() {
    this.currentUser$.subscribe(user => {
      if (user) {
        this.username = user.username;
      }
    });
  }

  loadAllUsers() {
    this.adminService.getUsers().subscribe({
      next: (response) => {
        // Include all users regardless of status (APPROVED, PENDING, DISABLED, etc.)
        this.allUsers = response.users || [];
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.toastr.error('Failed to load users list');
      }
    });
  }

  updateUsername() {
    if (!this.username || this.username.trim().length < 3) {
      this.toastr.error('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(this.username.toLowerCase())) {
      this.toastr.error('Username can only contain lowercase letters, numbers, and underscores');
      return;
    }

    this.loading = true;
    this.authService.updateProfile(this.username.toLowerCase(), undefined).subscribe({
      next: () => {
        this.toastr.success('Username updated successfully');
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to update username:', err);
        const errorMsg = err.error?.message || 'Failed to update username';
        this.toastr.error(errorMsg);
        this.loading = false;
        // Reload current user to restore original username
        this.loadCurrentUser();
      }
    });
  }

  updatePassword() {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.toastr.error('Password must be at least 6 characters');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.toastr.error('Passwords do not match');
      return;
    }

    this.loading = true;
    this.authService.updateProfile(undefined, this.newPassword).subscribe({
      next: () => {
        this.toastr.success('Password updated successfully');
        this.newPassword = '';
        this.confirmPassword = '';
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to update password:', err);
        let errorMsg = 'Failed to update password';
        if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.error?.errors && err.error.errors.length > 0) {
          errorMsg = err.error.errors[0].msg || err.error.errors[0].message || errorMsg;
        }
        this.toastr.error(errorMsg);
        this.loading = false;
      }
    });
  }

  openUserPasswordModal(userId: string) {
    this.selectedUserId = userId;
    this.selectedUserPassword = '';
    this.showUserPasswordModal = true;
  }

  closeUserPasswordModal() {
    this.selectedUserId = null;
    this.selectedUserPassword = '';
    this.showUserPasswordModal = false;
  }

  updateUserPassword() {
    if (!this.selectedUserId || !this.selectedUserPassword || this.selectedUserPassword.length < 6) {
      this.toastr.error('Password must be at least 6 characters');
      return;
    }

    this.loading = true;
    this.adminService.updateUserPassword(this.selectedUserId, this.selectedUserPassword).subscribe({
      next: () => {
        this.toastr.success('User password updated successfully');
        this.closeUserPasswordModal();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to update user password:', err);
        let errorMsg = 'Failed to update user password';
        if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.error?.errors && err.error.errors.length > 0) {
          errorMsg = err.error.errors[0].msg || err.error.errors[0].message || errorMsg;
        }
        this.toastr.error(errorMsg);
        this.loading = false;
      }
    });
  }

  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  getSelectedUserName(): string {
    if (!this.selectedUserId) return '';
    const user = this.allUsers.find(u => u._id === this.selectedUserId);
    return user ? `${user.displayName} (${user.username})` : '';
  }
}

