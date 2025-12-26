import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Settings {
  [key: string]: any;
}

export interface SettingsResponse {
  settings: Settings;
}

export interface SettingResponse {
  setting: {
    key: string;
    value: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private http = inject(HttpClient);
  private apiUrl = '/api/admin/settings';
  private settingsSubject = new BehaviorSubject<Settings>({});
  public settings$ = this.settingsSubject.asObservable();

  constructor() {
    this.loadSettings();
  }

  loadSettings(): void {
    this.http.get<SettingsResponse>(this.apiUrl).subscribe({
      next: (response) => {
        this.settingsSubject.next(response.settings);
      },
      error: (err) => {
        console.error('Failed to load settings:', err);
        // Default settings if load fails
        this.settingsSubject.next({ showPaperTimestamps: false });
      }
    });
  }

  getSettings(): Observable<SettingsResponse> {
    return this.http.get<SettingsResponse>(this.apiUrl).pipe(
      tap(response => {
        this.settingsSubject.next(response.settings);
      })
    );
  }

  getSetting(key: string): Observable<SettingResponse> {
    return this.http.get<SettingResponse>(`${this.apiUrl}/${key}`);
  }

  updateSetting(key: string, value: any, description?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${key}`, { value, description }).pipe(
      tap(() => {
        // Update local cache
        const currentSettings = this.settingsSubject.value;
        this.settingsSubject.next({ ...currentSettings, [key]: value });
      })
    );
  }

  getSettingValue(key: string): any {
    return this.settingsSubject.value[key];
  }

  isSettingEnabled(key: string): boolean {
    const value = this.getSettingValue(key);
    return value === true || value === 'true';
  }
}

