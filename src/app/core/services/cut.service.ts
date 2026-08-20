import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  constructor(private http: HttpClient) {}

  runCut(data: RunCutDto): Observable<{ message: string, data: CutResult }> {
    return this.http.post<{ message: string, data: CutResult }>(`${this.apiUrl}/run`, data);
  }
}
