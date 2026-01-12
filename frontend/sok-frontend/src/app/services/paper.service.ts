import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Paper {
  _id?: string;
  title: string;
  authors: string;
  venue?: string;
  year?: number;
  link?: string;
  readingStatus: 'TO_READ' | 'IN_PROGRESS' | 'READ';
  tags?: string[];
  sok?: {
    category?: string;
    method?: string;
    threatModel?: string[];
    dataset?: string;
    keyFindings?: string;
    limitations?: string;
    reproducibility?: {
      code?: string;
      data?: string;
    };
  };
  createdByUserId?: string | null;
  createdBy?: {
    username: string;
    displayName: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
  isFavorite?: boolean;
}

export interface PapersResponse {
  papers: Paper[];
}

@Injectable({
  providedIn: 'root'
})
export class PaperService {
  private http = inject(HttpClient);
  private apiUrl = '/api';

  getPapers(tag?: string, threatModel?: string, venue?: string, year?: number): Observable<PapersResponse> {
    const params: any = {};
    if (tag) params.tag = tag;
    if (threatModel) params.threatModel = threatModel;
    if (venue) params.venue = venue;
    if (year) params.year = year.toString();
    return this.http.get<PapersResponse>(`${this.apiUrl}/papers`, { params });
  }

  getPaper(id: string): Observable<{ paper: Paper }> {
    return this.http.get<{ paper: Paper }>(`${this.apiUrl}/papers/${id}`);
  }

  createPaper(paper: Partial<Paper>): Observable<{ paper: Paper }> {
    return this.http.post<{ paper: Paper }>(`${this.apiUrl}/papers`, paper);
  }

  updatePaper(id: string, paper: Partial<Paper>): Observable<{ paper: Paper }> {
    return this.http.patch<{ paper: Paper }>(`${this.apiUrl}/papers/${id}`, paper);
  }

  updateReadingStatus(id: string, readingStatus: 'TO_READ' | 'IN_PROGRESS' | 'READ'): Observable<{ paper: Paper }> {
    return this.http.patch<{ paper: Paper }>(`${this.apiUrl}/papers/${id}/reading-status`, { readingStatus });
  }

  deletePaper(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/papers/${id}`);
  }
}

