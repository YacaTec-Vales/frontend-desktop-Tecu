import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  constructor(private http: HttpClient) {}

  getPendingRequests(): Observable<CreditRaiseRequest[]> {
    return this.http.get<{ message: string, data: CreditRaiseRequest[] }>(`${this.apiUrl}/pending`)
      .pipe(map(res => res.data));
  }

  approveRequest(id: string, payload?: { montoCentavos?: number, notas?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/approve`, payload || {});
  }

  rejectRequest(id: string, payload?: { notas?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/reject`, payload || {});
  }
}
