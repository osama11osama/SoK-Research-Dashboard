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
  createdAt?: string;
  updatedAt?: string;
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

  getPapers(): Observable<PapersResponse> {
    return this.http.get<PapersResponse>(`${this.apiUrl}/papers`);
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

  deletePaper(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/papers/${id}`);
  }
}

