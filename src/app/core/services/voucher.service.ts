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
    return this.http.post<{ message: string, data: any }>(`${this.apiUrl}/find/${folio}`, {})
      .pipe(map(res => {
        const d = res.data;
        return {
          folio: d.voucher.folio,
          tipo: d.voucher.voucherType === 'PREVALE' ? 'Pre-Vale' : 'Digital',
          cliente: d.client.fullName,
          montoPesos: d.voucher.amountCents / 100,
          status: d.voucher.status,
          requiresIdentityVerification: d.isPrevale
        } as VoucherDetails;
      }));
  }

  confirmVoucher(folio: string, payload: { authorizationNumber: string, dataConfirmed: boolean, documents?: any[] }): Observable<any> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/confirm/${folio}`, payload);
  }
}
