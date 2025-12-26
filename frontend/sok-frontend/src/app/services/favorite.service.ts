import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FavoriteIdsResponse {
  favoriteIds: string[];
}

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private http = inject(HttpClient);
  private apiUrl = '/api/favorites';

  getFavoriteIds(): Observable<FavoriteIdsResponse> {
    return this.http.get<FavoriteIdsResponse>(this.apiUrl);
  }

  addFavorite(paperId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${paperId}`, {});
  }

  removeFavorite(paperId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${paperId}`);
  }
}

