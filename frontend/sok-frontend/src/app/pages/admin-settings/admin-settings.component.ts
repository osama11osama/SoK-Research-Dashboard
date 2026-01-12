import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SettingsService } from '../../services/settings.service';
import { AuthService } from '../../services/auth.service';
import { NotificationBellComponent } from '../../components/notification-bell/notification-bell.component';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, NotificationBellComponent, ThemeToggleComponent],
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
  
  // Theme availability settings
  availableThemes: { [key: string]: boolean } = {
    light: true,
    dark: true,
    dracula: true,
    nord: true,
    monokai: true
  };

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.settingsLoading = true;
    this.settingsService.getSettings().subscribe({
      next: (response) => {
        this.showPaperTimestamps = response.settings['showPaperTimestamps'] === true;
        this.showPaperCreator = response.settings['showPaperCreator'] === true;
        
        // Load theme availability settings
        const themeSettings = response.settings['availableThemes'];
        if (themeSettings && typeof themeSettings === 'object') {
          this.availableThemes = {
            light: themeSettings.light !== false,
            dark: themeSettings.dark !== false,
            dracula: themeSettings.dracula !== false,
            nord: themeSettings.nord !== false,
            monokai: themeSettings.monokai !== false
          };
        }
        
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

  updateThemeAvailability(theme: string) {
    this.loading = true;
    const currentThemes = this.settingsService.getSettingValue('availableThemes') || {};
    const updatedThemes = {
      ...currentThemes,
      [theme]: this.availableThemes[theme as keyof typeof this.availableThemes]
    };
    
    this.settingsService.updateSetting('availableThemes', updatedThemes, 'Control which themes are available to users').subscribe({
      next: () => {
        this.toastr.success('Theme settings updated successfully');
        this.loading = false;
        // Notify theme service to refresh available themes
        window.dispatchEvent(new CustomEvent('themes-updated'));
      },
      error: (err) => {
        console.error('Failed to update theme settings:', err);
        this.toastr.error('Failed to update theme settings');
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

