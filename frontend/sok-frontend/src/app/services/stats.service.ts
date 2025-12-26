import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Stats {
  papers: {
    total: number;
    toRead: number;
    inProgress: number;
    read: number;
    createdByMe?: number;
  };
  notes: {
    total: number;
    public: number;
    private: number;
  };
  users: {
    total: number;
    pending: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private http = inject(HttpClient);
  private apiUrl = '/api';

  getOverview(): Observable<{ stats: Stats }> {
    return this.http.get<{ stats: Stats }>(`${this.apiUrl}/stats/overview`);
  }
}

