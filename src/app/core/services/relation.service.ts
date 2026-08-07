import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RelationDetails {
  relationId: string;
  distributorId: string;
  distributorNumber: string;
  distributorName?: string; // Asumiendo que el backend envía el nombre, o se busca aparte.
  totalToPayCents: number;
  pointsAwarded: number;
  paymentStatus: string; // 'PENDING', 'PAID', 'LATE', etc.
}

export interface PaymentWindow {
  status: 'EARLY' | 'NORMAL' | 'CLOSED';
  deadline: string;
  latePenaltyCents?: number;
  pointsPenaltyBps?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RelationService {
  private apiUrl = `${environment.apiUrl}/relations`;

  constructor(private http: HttpClient) {}

  getRelation(id: string): Observable<RelationDetails> {
    return this.http.get<{ message: string, data: RelationDetails }>(`${this.apiUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  getPaymentWindow(id: string): Observable<PaymentWindow> {
    return this.http.get<{ message: string, data: PaymentWindow }>(`${this.apiUrl}/${id}/payment-window`)
      .pipe(map(res => res.data));
  }

  payRelation(id: string, amountCents: number, reference: string): Observable<any> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${id}/pay`, { amountCents, reference });
  }
}
