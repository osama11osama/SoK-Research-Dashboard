import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SettingsService } from './settings.service';

export type Theme = 'light' | 'dark' | 'dracula' | 'nord' | 'monokai';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private settingsService = inject(SettingsService);
  private themeSubject = new BehaviorSubject<Theme>('light');
  private availableThemesSubject = new BehaviorSubject<Theme[]>(['light', 'dark', 'dracula', 'nord', 'monokai']);
  public theme$: Observable<Theme> = this.themeSubject.asObservable();
  public availableThemes$: Observable<Theme[]> = this.availableThemesSubject.asObservable();

  constructor() {
    // Load available themes from settings
    this.loadAvailableThemes();
    
    // Subscribe to settings changes to reload themes when settings update
    this.settingsService.settings$.subscribe(() => {
      this.loadAvailableThemes();
      // Re-apply current theme in case it's no longer available
      this.ensureValidTheme();
    });
    
    // Listen for theme updates from admin settings
    window.addEventListener('themes-updated', () => {
      this.loadAvailableThemes();
      this.ensureValidTheme();
    });
    
    // Apply saved theme after a short delay to ensure settings are loaded
    setTimeout(() => {
      this.ensureValidTheme();
    }, 100);
  }

  private ensureValidTheme() {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && this.isValidTheme(savedTheme)) {
      // Check if theme is still available
      const available = this.availableThemesSubject.value;
      if (available.includes(savedTheme)) {
        this.setTheme(savedTheme, false);
      } else {
        // Fallback to first available theme (usually light)
        this.setTheme(available[0] || 'light', false);
      }
    } else {
      const available = this.availableThemesSubject.value;
      this.setTheme(available[0] || 'light', false);
    }
  }

  private loadAvailableThemes() {
    const themeSettings = this.settingsService.getSettingValue('availableThemes');
    const themes: Theme[] = [];
    
    if (themeSettings && typeof themeSettings === 'object') {
      if (themeSettings.light !== false) themes.push('light');
      if (themeSettings.dark !== false) themes.push('dark');
      if (themeSettings.dracula !== false) themes.push('dracula');
      if (themeSettings.nord !== false) themes.push('nord');
      if (themeSettings.monokai !== false) themes.push('monokai');
    } else {
      // Default: all themes available
      themes.push('light', 'dark', 'dracula', 'nord', 'monokai');
    }
    
    // Ensure at least light theme is available
    if (themes.length === 0) {
      themes.push('light');
    }
    
    this.availableThemesSubject.next(themes);
  }

  private isValidTheme(theme: string): theme is Theme {
    return ['light', 'dark', 'dracula', 'nord', 'monokai'].includes(theme);
  }

  getCurrentTheme(): Theme {
    return this.themeSubject.value;
  }

  getAvailableThemes(): Theme[] {
    return this.availableThemesSubject.value;
  }

  setTheme(theme: Theme, save: boolean = true) {
    // Check if theme is available
    const available = this.availableThemesSubject.value;
    if (!available.includes(theme)) {
      console.warn(`Theme ${theme} is not available. Using first available theme.`);
      theme = available[0] || 'light';
    }
    
    // Remove all theme classes
    document.documentElement.classList.remove('light', 'dark', 'dracula', 'nord', 'monokai');
    
    // Add new theme class
    document.documentElement.classList.add(theme);
    
    // Update subject
    this.themeSubject.next(theme);
    
    // Save to localStorage
    if (save) {
      localStorage.setItem('theme', theme);
    }
  }

  toggleTheme() {
    const themes = this.availableThemesSubject.value;
    const currentIndex = themes.indexOf(this.themeSubject.value);
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }
}

