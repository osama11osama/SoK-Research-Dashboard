import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, Theme } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.css'
})
export class ThemeToggleComponent implements OnInit {
  private themeService = inject(ThemeService);
  
  currentTheme$ = this.themeService.theme$;
  availableThemes$ = this.themeService.availableThemes$;
  showThemeMenu = false;

  ngOnInit() {
    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      if (!(event.target as HTMLElement).closest('.theme-toggle-container')) {
        this.showThemeMenu = false;
      }
    });
  }

  toggleThemeMenu() {
    this.showThemeMenu = !this.showThemeMenu;
  }

  setTheme(theme: string) {
    this.themeService.setTheme(theme as Theme);
    this.showThemeMenu = false;
  }

  getThemeIcon(theme: string): string {
    switch (theme) {
      case 'light':
        return 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z';
      case 'dark':
        return 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z';
      case 'dracula':
        return 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z';
      case 'nord':
        return 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z';
      case 'monokai':
        return 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01';
      default:
        return 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z';
    }
  }

  getThemeName(theme: string): string {
    const names: Record<string, string> = {
      light: 'Light',
      dark: 'Dark',
      dracula: 'Dracula',
      nord: 'Nord',
      monokai: 'Monokai'
    };
    return names[theme] || theme;
  }

  onThemeItemMouseEnter(event: MouseEvent, theme: string) {
    const element = event.currentTarget as HTMLElement;
    if (element && !this.isThemeActive(theme)) {
      element.style.backgroundColor = 'var(--bg-tertiary)';
      element.style.borderColor = 'var(--border-color)';
    }
  }

  onThemeItemMouseLeave(event: MouseEvent, theme: string) {
    const element = event.currentTarget as HTMLElement;
    if (element && !this.isThemeActive(theme)) {
      element.style.backgroundColor = 'transparent';
      element.style.borderColor = 'transparent';
    }
  }

  isThemeActive(theme: string): boolean {
    return this.themeService.getCurrentTheme() === theme;
  }
}

