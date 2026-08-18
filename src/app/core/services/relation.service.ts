import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from './staff.service';

export interface RelationDetails {
  id: string;
  referencePayment: string;
  distributorId: string;
  cutDate: string;
  paymentDeadlineDate: string;
  totalToPayCents: number;
  totalPaidCents: number;
  totalCommissionCents: number;
  totalPaymentCents: number;
  totalPenaltiesCents: number;
  remainingCents: number;
  reconciliationStatus: 'PENDIENTE' | 'PARCIAL' | 'LIQUIDADO' | 'SALDO_FAVOR_SUCURSAL';
  pointsAtCut: number;
  createdAt: string;
}

export interface PaymentWindow {
  status: 'EARLY' | 'NORMAL' | 'LATE' | 'CLOSED';
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

  payRelation(id: string, montoCentavos: number, paymentMethod: string): Observable<any> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${id}/pay`, { montoCentavos, paymentMethod });
  }

  getPendingRelations(page: number = 1, limit: number = 100, search?: string): Observable<PaginatedResponse<RelationDetails>> {
    // MOCK DATA
    const mockRelations: RelationDetails[] = [
      { id: 'rel-1', referencePayment: 'REF-001', distributorId: 'dist-1', cutDate: '2026-08-01', paymentDeadlineDate: '2026-08-16', totalToPayCents: 150000, totalPaidCents: 0, totalCommissionCents: 15000, totalPaymentCents: 150000, totalPenaltiesCents: 0, remainingCents: 150000, reconciliationStatus: 'PENDIENTE', pointsAtCut: 100, createdAt: new Date().toISOString() },
      { id: 'rel-2', referencePayment: 'REF-002', distributorId: 'dist-2', cutDate: '2026-08-01', paymentDeadlineDate: '2026-08-16', totalToPayCents: 200000, totalPaidCents: 50000, totalCommissionCents: 20000, totalPaymentCents: 200000, totalPenaltiesCents: 0, remainingCents: 150000, reconciliationStatus: 'PARCIAL', pointsAtCut: 150, createdAt: new Date().toISOString() }
    ];

    let data = mockRelations;
    if (search) {
      data = data.filter(r => r.referencePayment.includes(search));
    }

    return of({
      data,
      meta: { page, limit, itemCount: data.length, pageCount: 1, hasPreviousPage: false, hasNextPage: false }
    }).pipe(delay(500));
  }
}
