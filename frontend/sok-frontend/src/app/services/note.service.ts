import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Note {
  _id?: string;
  paperId: string;
  authorUserId: string;
  visibility: 'PRIVATE' | 'PUBLIC';
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotesResponse {
  notes: Note[];
}

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private http = inject(HttpClient);
  private apiUrl = '/api';

  getNotes(paperId: string): Observable<NotesResponse> {
    return this.http.get<NotesResponse>(`${this.apiUrl}/papers/${paperId}/notes`);
  }

  createNote(paperId: string, content: string, visibility: 'PRIVATE' | 'PUBLIC'): Observable<{ note: Note }> {
    return this.http.post<{ note: Note }>(`${this.apiUrl}/papers/${paperId}/notes`, {
      content,
      visibility
    });
  }

  updateNote(paperId: string, noteId: string, content?: string, visibility?: 'PRIVATE' | 'PUBLIC'): Observable<{ note: Note }> {
    const body: any = {};
    if (content !== undefined) body.content = content;
    if (visibility !== undefined) body.visibility = visibility;
    return this.http.patch<{ note: Note }>(`${this.apiUrl}/papers/${paperId}/notes/${noteId}`, body);
  }

  deleteNote(paperId: string, noteId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/papers/${paperId}/notes/${noteId}`);
  }
}

