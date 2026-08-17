import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AutorizacionResponseDto {
  id: string;
  authorizationType: string;
  requesterId: string;
  affectedEntity: any;
  justification: string;
  status: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AutorizacionService {
  private apiUrl = `${environment.apiUrl}/autorizaciones`;

  constructor(private http: HttpClient) {}

  getAutorizaciones(): Observable<AutorizacionResponseDto[]> {
    return this.http.get<{ message: string, data: AutorizacionResponseDto[] }>(this.apiUrl)
      .pipe(map(res => res.data));
  }

  aprobarAutorizacion(id: string, payload?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/aprobar`, payload || {});
  }

  rechazarAutorizacion(id: string, payload?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/rechazar`, payload || {});
  }
}
