import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminUser {
  _id: string;
  username: string;
  displayName: string;
  role: 'SUPER_ADMIN' | 'REVIEWER_VIEW' | 'REVIEWER_NOTE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED';
  createdAt: string;
  approvedAt?: string;
  approvedByUserId?: string;
}

export interface UsersResponse {
  users: AdminUser[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = '/api';

  getUsers(status?: string): Observable<UsersResponse> {
    if (status) {
      return this.http.get<UsersResponse>(`${this.apiUrl}/admin/users`, { params: { status } });
    } else {
      return this.http.get<UsersResponse>(`${this.apiUrl}/admin/users`);
    }
  }

  getUser(id: string): Observable<{ user: AdminUser }> {
    return this.http.get<{ user: AdminUser }>(`${this.apiUrl}/admin/users/${id}`);
  }

  approveUser(id: string, role: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/users/${id}/approve`, { role });
  }

  rejectUser(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/users/${id}/reject`, {});
  }

  disableUser(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/users/${id}/disable`, {});
  }

  updateUserRole(id: string, role: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/users/${id}/role`, { role });
  }

  updateUserPassword(id: string, password: string): Observable<{ message: string; user: AdminUser }> {
    return this.http.patch<{ message: string; user: AdminUser }>(`${this.apiUrl}/admin/users/${id}/password`, { password });
  }

  // Multi-source Paper Search Tool
  searchPapers(query: string, maxResults: number = 50, sources?: string[]): Observable<{ papers: SearchPaper[]; total: number; sources: string[]; query: string }> {
    const params: any = { query, maxResults: maxResults.toString() };
    if (sources && sources.length > 0) {
      params.sources = sources.join(',');
    }
    return this.http.get<{ papers: SearchPaper[]; total: number; sources: string[]; query: string }>(`${this.apiUrl}/admin/tools/search`, { params });
  }

  // DBLP Paper Search Tool (legacy, kept for backward compatibility)
  searchDBLP(query: string, maxResults: number = 50): Observable<{ papers: DBLPPaper[]; total: number }> {
    return this.http.get<{ papers: DBLPPaper[]; total: number }>(`${this.apiUrl}/admin/tools/dblp-search`, {
      params: { query, maxResults: maxResults.toString() }
    });
  }

  addPaperFromSearch(paper: Partial<SearchPaper>, searchQuery?: string, sources?: string[]): Observable<{ paper: any }> {
    const paperData = {
      ...paper,
      searchQuery: searchQuery || null,
      sources: sources || [],
      discoveryMethod: 'SEARCH_TOOL'
    };
    return this.http.post<{ paper: any }>(`${this.apiUrl}/admin/tools/add-paper`, paperData);
  }

  // Legacy method for backward compatibility
  addPaperFromDBLP(paper: Partial<DBLPPaper>): Observable<{ paper: any }> {
    return this.addPaperFromSearch(paper);
  }

  // Get Semantic Scholar Summary/TLDR
  getSemanticScholarSummary(paperId: string): Observable<{ summary: { title: string; abstract: string | null; tldr: string | null } }> {
    return this.http.get<{ summary: { title: string; abstract: string | null; tldr: string | null } }>(`${this.apiUrl}/admin/tools/semantic-summary/${paperId}`);
  }
}

export interface DBLPPaper {
  title: string;
  authors: string;
  venue: string;
  year: number | null;
  url: string | null;
  doi: string | null;
  type: string | null;
}

export interface SearchPaper {
  source: string;
  sources?: string[]; // Multiple sources if found in multiple APIs
  title: string;
  authors: string;
  venue: string;
  year: number | null;
  url: string | null;
  doi: string | null;
  abstract?: string | null;
  citationCount?: number;
  influentialCitationCount?: number;
  semanticScholarId?: string | null;
  arxivId?: string | null;
  dblpKey?: string | null;
  openAlexId?: string | null;
  crossrefId?: string | null;
}

