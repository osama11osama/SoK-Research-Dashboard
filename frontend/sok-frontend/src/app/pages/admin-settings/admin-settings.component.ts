import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SettingsService } from '../../services/settings.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css'
})
export class AdminSettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  
  currentUser$ = this.authService.currentUser$;

  showPaperTimestamps = false;
  showPaperCreator = false;
  loading = false;
  settingsLoading = false;

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.settingsLoading = true;
    this.settingsService.getSettings().subscribe({
      next: (response) => {
        this.showPaperTimestamps = response.settings['showPaperTimestamps'] === true;
        this.showPaperCreator = response.settings['showPaperCreator'] === true;
        this.settingsLoading = false;
      },
      error: (err) => {
        console.error('Failed to load settings:', err);
        this.toastr.error('Failed to load settings');
        this.settingsLoading = false;
      }
    });
  }

  updateTimestampVisibility() {
    this.loading = true;
    this.settingsService.updateSetting('showPaperTimestamps', this.showPaperTimestamps, 'Show paper creation timestamps on papers list').subscribe({
      next: () => {
        this.toastr.success('Settings updated successfully');
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to update settings:', err);
        this.toastr.error('Failed to update settings');
        this.loading = false;
      }
    });
  }

  updateCreatorVisibility() {
    this.loading = true;
    this.settingsService.updateSetting('showPaperCreator', this.showPaperCreator, 'Show who added each paper').subscribe({
      next: () => {
        this.toastr.success('Settings updated successfully');
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to update settings:', err);
        this.toastr.error('Failed to update settings');
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
      },
      error: () => {
        // Even if logout fails, clear local state and redirect
        this.router.navigate(['/login']);
      }
    });
  }
}

