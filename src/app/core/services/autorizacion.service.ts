import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

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
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private buildHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'X-Origin': 'vpn',
      'X-Client-App': 'Tecu'
    });
    const token = this.authService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getAutorizaciones(): Observable<AutorizacionResponseDto[]> {
    return this.http.get<{ message: string, data: AutorizacionResponseDto[] }>(this.apiUrl, {
      headers: this.buildHeaders()
    }).pipe(map(res => res.data));
  }

  aprobarAutorizacion(id: string, payload?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/aprobar`, payload || {}, {
      headers: this.buildHeaders()
    });
  }

  rechazarAutorizacion(id: string, payload?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/rechazar`, payload || {}, {
      headers: this.buildHeaders()
    });
  }
}
