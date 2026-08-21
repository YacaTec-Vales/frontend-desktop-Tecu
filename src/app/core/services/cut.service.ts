import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface RunCutDto {
  branchId: string;
  cutDate: string; // YYYY-MM-DD
}

export interface CutRelationSummary {
  relationId: string;
  distributorId: string;
  distributorNumber: string;
  voucherCount: number;
  totalToPayCents: number;
  pointsAwarded: number;
}

export interface CutResult {
  branchId: string;
  cutDate: string;
  paymentDeadlineDate: string;
  distributorsAffected: number;
  relationsCreated: number;
  relationDetailsCreated: number;
  totalToPayCents: number;
  totalCommissionCents: number;
  totalPenaltiesCents: number;
  totalPointsAwarded: number;
  relations: CutRelationSummary[];
  warnings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CutService {
  private apiUrl = `${environment.apiUrl}/cuts`;
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

  runCut(data: RunCutDto): Observable<{ message: string, data: CutResult }> {
    return this.http.post<{ message: string, data: CutResult }>(`${this.apiUrl}/run`, data, {
      headers: this.buildHeaders()
    });
  }
}
