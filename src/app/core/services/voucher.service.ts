import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VoucherDetails {
  folio: string;
  tipo: string;
  cliente: string;
  montoPesos: number;
  status: string;
  requiresIdentityVerification: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VoucherService {
  private apiUrl = `${environment.apiUrl}/cashier/vouchers`;

  constructor(private http: HttpClient) {}

  findVoucher(folio: string): Observable<VoucherDetails> {
    return this.http.post<{ message: string, data: VoucherDetails }>(`${this.apiUrl}/find/${folio}`, {})
      .pipe(map(res => res.data));
  }

  confirmVoucher(folio: string): Observable<any> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/confirm/${folio}`, {});
  }
}
