import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AdminService, AdminUser } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, NotificationBellComponent, ThemeToggleComponent],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);
  private toastr = inject(ToastrService);
  private router = inject(Router);

  pendingUsers: AdminUser[] = [];
  allUsers: AdminUser[] = [];
  selectedUser: AdminUser | null = null;
  selectedRole: string = 'REVIEWER_VIEW';
  showApprovalModal = false;
  loading = false;
  showPaperTimestamps = false;
  settingsLoading = false;
  sourceLoading = false;

  // Available search sources
  availableSources = [
    { id: 'dblp', name: 'DBLP', description: 'Computer Science Bibliography', enabled: true },
    { id: 'semantic', name: 'Semantic Scholar', description: 'AI summaries & citations', enabled: true },
    { id: 'openalex', name: 'OpenAlex', description: 'Open alternative to Google Scholar', enabled: true },
    { id: 'arxiv', name: 'arXiv', description: 'Preprints & recent papers', enabled: true },
    { id: 'crossref', name: 'Crossref', description: 'DOI validation & metadata', enabled: true }
  ];

  ngOnInit() {
    this.loadPendingUsers();
    this.loadAllUsers();
    this.loadSettings();
    this.loadSourceSettings();
  }

  loadSettings() {
    this.settingsService.getSettings().subscribe({
      next: (response) => {
        this.showPaperTimestamps = response.settings['showPaperTimestamps'] === true;
      },
      error: (err) => {
        console.error('Failed to load settings:', err);
      }
    });
  }

  loadSourceSettings() {
    this.settingsService.getSettings().subscribe({
      next: (response) => {
        const sourceSettings = response.settings['availableSources'];
        if (sourceSettings && typeof sourceSettings === 'object') {
          this.availableSources.forEach(source => {
            source.enabled = sourceSettings[source.id] !== false;
          });
        }
      },
      error: (err) => {
        console.error('Failed to load source settings:', err);
      }
    });
  }

  updateSourceVisibility(sourceId: string) {
    this.sourceLoading = true;
    const source = this.availableSources.find(s => s.id === sourceId);
    if (!source) return;

    const currentSettings = this.settingsService.getSettingValue('availableSources') || {};
    const updatedSettings = {
      ...currentSettings,
      [sourceId]: source.enabled
    };

    this.settingsService.updateSetting('availableSources', updatedSettings, 'Control which search sources are available to users').subscribe({
      next: () => {
        this.toastr.success(`${source.name} ${source.enabled ? 'enabled' : 'disabled'} successfully`);
        this.sourceLoading = false;
        // Notify other components
        window.dispatchEvent(new CustomEvent('sources-updated'));
      },
      error: (err) => {
        console.error('Failed to update source settings:', err);
        this.toastr.error('Failed to update source settings');
        // Revert the change
        source.enabled = !source.enabled;
        this.sourceLoading = false;
      }
    });
  }

  getSourceBadgeColor(sourceName: string): string {
    const colors: Record<string, string> = {
      'DBLP': 'bg-blue-100 text-blue-800',
      'Semantic Scholar': 'bg-purple-100 text-purple-800',
      'OpenAlex': 'bg-green-100 text-green-800',
      'arXiv': 'bg-orange-100 text-orange-800',
      'Crossref': 'bg-indigo-100 text-indigo-800'
    };
    return colors[sourceName] || 'bg-slate-100 text-slate-800';
  }

  updateTimestampVisibility() {
    this.settingsLoading = true;
    this.settingsService.updateSetting('showPaperTimestamps', this.showPaperTimestamps, 'Show paper creation timestamps on papers list').subscribe({
      next: () => {
        this.toastr.success('Settings updated successfully');
        this.settingsLoading = false;
      },
      error: (err) => {
        console.error('Failed to update settings:', err);
        this.toastr.error('Failed to update settings');
        this.settingsLoading = false;
      }
    });
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
        this.toastr.success(`User ${this.selectedUser?.displayName} approved successfully`);
      },
      error: (err) => {
        console.error('Failed to approve user:', err);
        this.toastr.error(err.error?.message || 'Failed to approve user');
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
        this.toastr.success(`User ${user.displayName} rejected`);
      },
      error: (err) => {
        console.error('Failed to reject user:', err);
        this.toastr.error(err.error?.message || 'Failed to reject user');
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
        this.toastr.success(`User ${user.displayName} disabled`);
      },
      error: (err) => {
        console.error('Failed to disable user:', err);
        this.toastr.error(err.error?.message || 'Failed to disable user');
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

  currentUser$ = this.authService.currentUser$;

  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Even if logout fails, clear local state and redirect
        this.router.navigate(['/login']);
      }
    });
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

  get enabledSourcesCount(): number {
    return this.availableSources.filter(s => s.enabled).length;
  }
}

