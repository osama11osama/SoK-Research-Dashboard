import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService, AdminUser } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);

  pendingUsers: AdminUser[] = [];
  allUsers: AdminUser[] = [];
  selectedUser: AdminUser | null = null;
  selectedRole: string = 'REVIEWER_VIEW';
  showApprovalModal = false;
  loading = false;

  ngOnInit() {
    this.loadPendingUsers();
    this.loadAllUsers();
  }

  loadPendingUsers() {
    this.adminService.getUsers('PENDING').subscribe({
      next: (response) => {
        this.pendingUsers = response.users;
      },
      error: (err) => {
        console.error('Failed to load pending users:', err);
      }
    });
  }

  loadAllUsers() {
    this.adminService.getUsers().subscribe({
      next: (response) => {
        this.allUsers = response.users;
      },
      error: (err) => {
        console.error('Failed to load users:', err);
      }
    });
  }

  openApprovalModal(user: AdminUser) {
    this.selectedUser = user;
    this.selectedRole = 'REVIEWER_VIEW';
    this.showApprovalModal = true;
  }

  closeApprovalModal() {
    this.showApprovalModal = false;
    this.selectedUser = null;
  }

  approveUser() {
    if (!this.selectedUser) return;

    this.loading = true;
    this.adminService.approveUser(this.selectedUser._id, this.selectedRole).subscribe({
      next: () => {
        this.loadPendingUsers();
        this.loadAllUsers();
        this.closeApprovalModal();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to approve user:', err);
        alert(err.error?.message || 'Failed to approve user');
        this.loading = false;
      }
    });
  }

  rejectUser(user: AdminUser) {
    if (!confirm(`Are you sure you want to reject ${user.displayName}?`)) {
      return;
    }

    this.adminService.rejectUser(user._id).subscribe({
      next: () => {
        this.loadPendingUsers();
        this.loadAllUsers();
      },
      error: (err) => {
        console.error('Failed to reject user:', err);
        alert(err.error?.message || 'Failed to reject user');
      }
    });
  }

  disableUser(user: AdminUser) {
    if (!confirm(`Are you sure you want to disable ${user.displayName}?`)) {
      return;
    }

    this.adminService.disableUser(user._id).subscribe({
      next: () => {
        this.loadAllUsers();
      },
      error: (err) => {
        console.error('Failed to disable user:', err);
        alert(err.error?.message || 'Failed to disable user');
      }
    });
  }

  getStatusColor(status: string) {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-amber-100 text-amber-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      case 'DISABLED':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  getRoleBadge(role: string) {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-700';
      case 'REVIEWER_NOTE':
        return 'bg-blue-100 text-blue-700';
      case 'REVIEWER_VIEW':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }
}

