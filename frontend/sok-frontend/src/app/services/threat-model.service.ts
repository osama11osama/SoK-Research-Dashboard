import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ThreatModel {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  category?: 'Vulnerability' | 'Attack' | 'Privacy' | 'Security' | 'Other';
  createdAt?: string;
  updatedAt?: string;
}

export interface ThreatModelsResponse {
  threatModels: ThreatModel[];
}

export interface ThreatModelResponse {
  threatModel: ThreatModel;
}

@Injectable({
  providedIn: 'root'
})
export class ThreatModelService {
  private http = inject(HttpClient);
  private apiUrl = '/api/threat-models';

  getThreatModels(): Observable<ThreatModelsResponse> {
    return this.http.get<ThreatModelsResponse>(this.apiUrl);
  }

  getThreatModel(id: string): Observable<ThreatModelResponse> {
    return this.http.get<ThreatModelResponse>(`${this.apiUrl}/${id}`);
  }

  createThreatModel(threatModel: { name: string; displayName?: string; description?: string; category?: string }): Observable<ThreatModelResponse> {
    return this.http.post<ThreatModelResponse>(this.apiUrl, threatModel);
  }

  updateThreatModel(id: string, threatModel: Partial<ThreatModel>): Observable<ThreatModelResponse> {
    return this.http.patch<ThreatModelResponse>(`${this.apiUrl}/${id}`, threatModel);
  }

  deleteThreatModel(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}

