import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from './staff.service';
import { AuthService } from './auth.service';

export interface BankMovement {
  id: string;
  batchId: string;
  reference: string;
  paymentCents: number;
  paymentDate: string;
  reconciliationId?: string | null;
}

export interface ReconciliationBatch {
  id: string;
  originalFileName: string;
  totalMovements: number;
  totalReconciled: number;
  totalBranchCreditBalance: number;
  status: 'EN_PROCESO' | 'COMPLETADO' | 'ERROR';
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReconciliationService {
  private apiUrl = `${environment.apiUrl}/reconciliations`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private buildHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'X-Client-App': 'Tecu'
    });
    const token = this.authService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  uploadExcel(file: File): Observable<{ message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ message: string }>(`${this.apiUrl}/upload`, formData, {
      headers: this.buildHeaders()
    });
  }

  requestManualReconciliation(bankMovementId: string, relationId: string, authorizationId: string): Observable<{ message: string }> {
    const url = `${this.apiUrl}/manual`;
    return this.http.post<{ message: string }>(url, {
      bankMovementId,
      relationId,
      authorizationId
    }, {
      headers: this.buildHeaders()
    });
  }

  getBatches(page: number = 1, limit: number = 100): Observable<PaginatedResponse<ReconciliationBatch>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<any>(`${this.apiUrl}/batches`, {
      params,
      headers: this.buildHeaders()
    }).pipe(
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

  getUnmatchedMovements(page: number = 1, limit: number = 100): Observable<PaginatedResponse<BankMovement>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<any>(`${this.apiUrl}/bank-movements/unmatched`, {
      params,
      headers: this.buildHeaders()
    }).pipe(
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
