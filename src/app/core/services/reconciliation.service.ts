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

  manualReconciliation(bankMovementId: string, relationId: string, authorizationId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/manual`, {
      bankMovementId,
      relationId,
      authorizationId
    });
  }

  getBatches(page: number = 1, limit: number = 100): Observable<PaginatedResponse<ReconciliationBatch>> {
    const mockBatches: ReconciliationBatch[] = [
      { id: 'batch-1', originalFileName: 'estado_cuenta_01.xlsx', totalMovements: 120, totalReconciled: 118, totalBranchCreditBalance: 200000, status: 'COMPLETADO', createdAt: new Date().toISOString() },
      { id: 'batch-2', originalFileName: 'estado_cuenta_02.xlsx', totalMovements: 50, totalReconciled: 50, totalBranchCreditBalance: 0, status: 'COMPLETADO', createdAt: new Date().toISOString() }
    ];

    return of({
      data: mockBatches,
      meta: { page, limit, itemCount: mockBatches.length, pageCount: 1, hasPreviousPage: false, hasNextPage: false }
    }).pipe(delay(500));
  }

  getUnmatchedMovements(page: number = 1, limit: number = 100): Observable<PaginatedResponse<BankMovement>> {
    const mockMovements: BankMovement[] = [
      { id: 'mov-1', batchId: 'batch-1', reference: 'REF-ERR-001', paymentCents: 150050, paymentDate: '2026-08-15', reconciliationId: null },
      { id: 'mov-2', batchId: 'batch-1', reference: 'REF-INCOMPLETA', paymentCents: 50000, paymentDate: '2026-08-16', reconciliationId: null }
    ];

    return of({
      data: mockMovements,
      meta: { page, limit, itemCount: mockMovements.length, pageCount: 1, hasPreviousPage: false, hasNextPage: false }
    }).pipe(delay(500));
  }
}
