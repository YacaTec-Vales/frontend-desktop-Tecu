import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface CreditRaiseRequest {
  id: string;
  distributorId: string;
  branchId?: string;
  requestedAmountCents: number;
  status: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CreditRaiseService {
  private apiUrl = `${environment.apiUrl}/credit-raise-requests`;
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

  getPendingRequests(): Observable<CreditRaiseRequest[]> {
    return this.http.get<{ message: string, data: CreditRaiseRequest[] }>(`${this.apiUrl}/pending`, {
      headers: this.buildHeaders()
    })
      .pipe(map(res => res.data));
  }

  approveRequest(id: string, payload?: { montoCentavos?: number, notas?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/approve`, payload || {}, {
      headers: this.buildHeaders()
    });
  }

  rejectRequest(id: string, payload?: { notas?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/reject`, payload || {}, {
      headers: this.buildHeaders()
    });
  }
}
