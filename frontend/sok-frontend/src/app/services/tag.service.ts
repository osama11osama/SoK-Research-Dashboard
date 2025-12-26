import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Tag {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TagsResponse {
  tags: Tag[];
}

export interface TagResponse {
  tag: Tag;
}

@Injectable({
  providedIn: 'root'
})
export class TagService {
  private http = inject(HttpClient);
  private apiUrl = '/api/tags';

  getTags(): Observable<TagsResponse> {
    return this.http.get<TagsResponse>(this.apiUrl);
  }

  getTag(id: string): Observable<TagResponse> {
    return this.http.get<TagResponse>(`${this.apiUrl}/${id}`);
  }

  createTag(tag: { name: string; displayName?: string; description?: string; color?: string }): Observable<TagResponse> {
    return this.http.post<TagResponse>(this.apiUrl, tag);
  }

  updateTag(id: string, tag: Partial<Tag>): Observable<TagResponse> {
    return this.http.patch<TagResponse>(`${this.apiUrl}/${id}`, tag);
  }

  deleteTag(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}

