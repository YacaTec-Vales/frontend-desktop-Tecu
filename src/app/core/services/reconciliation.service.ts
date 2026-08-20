import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from './staff.service';

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

  constructor(private http: HttpClient) {}

  uploadExcel(file: File): Observable<{ message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ message: string }>(`${this.apiUrl}/upload`, formData);
  }

  requestManualReconciliation(bankMovementId: string, relationId: string, justification: string): Observable<{ message: string }> {
    // Endpoint definido por el backend para crear la solicitud (Pull Request)
    // POST /api/v1/complaints/{id}/resolve
    // {id} corresponde al bankMovementId que se desea conciliar
    const url = `${environment.apiUrl}/complaints/${bankMovementId}/resolve`;
    return this.http.post<{ message: string }>(url, {
      relationId,
      justification
    });
  }

  getBatches(page: number = 1, limit: number = 100): Observable<PaginatedResponse<ReconciliationBatch>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedResponse<ReconciliationBatch>>(`${this.apiUrl}/batches`, { params });
  }

  getUnmatchedMovements(page: number = 1, limit: number = 100): Observable<PaginatedResponse<BankMovement>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedResponse<BankMovement>>(`${this.apiUrl}/bank-movements/unmatched`, { params });
  }
}
