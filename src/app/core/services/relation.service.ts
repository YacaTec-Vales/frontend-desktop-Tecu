import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<any>(`${this.apiUrl}/pending`, { params }).pipe(
      map(res => {
        const dataArr = res?.data?.data || res?.data || [];
        const rawMeta = res?.data?.meta || res?.meta;
        const itemCount = rawMeta?.itemCount ?? rawMeta?.total ?? dataArr.length;
        return {
          data: dataArr,
          meta: { 
            ...rawMeta,
            page: rawMeta?.page || page,
            limit: rawMeta?.limit || limit,
            itemCount: itemCount,
            pageCount: rawMeta?.pageCount || Math.ceil(itemCount / limit) || 1
          }
        };
      })
    );
  }

  getAllRelations(page: number = 1, limit: number = 100, branchId?: string): Observable<PaginatedResponse<RelationDetails>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (branchId) {
      params = params.set('branchId', branchId);
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(res => {
        const dataArr = res?.data?.data || res?.data || [];
        const rawMeta = res?.data?.meta || res?.meta;
        const itemCount = rawMeta?.itemCount ?? rawMeta?.total ?? dataArr.length;
        return {
          data: dataArr,
          meta: { 
            ...rawMeta,
            page: rawMeta?.page || page,
            limit: rawMeta?.limit || limit,
            itemCount: itemCount,
            pageCount: rawMeta?.pageCount || Math.ceil(itemCount / limit) || 1
          }
        };
      })
    );
  }
}
