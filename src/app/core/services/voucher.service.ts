import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface VoucherDetails {
  folio: string;
  tipo: string;
  cliente: string;
  montoPesos: number;
  status: string;
  requiresIdentityVerification: boolean;
  bankAccount?: {
    clabe: string;
    banco: string;
  };
  clientId?: string;
  clientData?: any;
}

@Injectable({
  providedIn: 'root'
})
export class VoucherService {
  private apiUrl = `${environment.apiUrl}/cashier/vouchers`;
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

  findVoucher(folio: string): Observable<VoucherDetails> {
    return this.http.post<{ message: string, data: any }>(`${this.apiUrl}/find/${folio}`, {}, {
      headers: this.buildHeaders()
    })
      .pipe(map(res => {
        const d = res.data;
        return {
          folio: d.voucher.folio,
          tipo: d.voucher.voucherType === 'PREVALE' ? 'Pre-Vale' : 'Digital',
          cliente: d.client.fullName,
          montoPesos: d.voucher.amountCents / 100,
          status: d.voucher.status,
          requiresIdentityVerification: d.isPrevale,
          bankAccount: d.client.bankAccount,
          clientId: d.client.id,
          clientData: d.client
        } as VoucherDetails;
      }));
  }

  confirmVoucher(folio: string, payload: { authorizationNumber: string, dataConfirmed: boolean, documents?: any[] }): Observable<any> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/confirm/${folio}`, payload, {
      headers: this.buildHeaders()
    });
  }

  reportClientDiscrepancy(folio: string, payload: any): Observable<any> {
    // Para enviar archivos via FormData no es necesario el Content-Type, el navegador lo inyecta con su boundary
    return this.http.post<{ message: string; data: any }>(`${this.apiUrl}/${folio}/client-discrepancy`, payload, {
      headers: this.buildHeaders()
    });
  }

  getVouchers(status: string = 'ACTIVO', voucherType: string = 'PREVALE', limit: number = 50): Observable<{data: any[], meta: any}> {
    return this.http.get<{ message: string; data: any; meta?: any }>(`${this.apiUrl}?status=${status}&voucherType=${voucherType}&limit=${limit}`, {
      headers: this.buildHeaders()
    }).pipe(
      map(res => {
        // Asumimos que el backend retorna un array en res.data, res.data.vouchers o res.data.data
        const items = Array.isArray(res.data) ? res.data : (res.data?.vouchers || res.data?.data || []);
        const total = res.meta?.totalItems || items.length;
        return {
          data: items,
          meta: {
            page: 1,
            limit: limit,
            itemCount: total,
            pageCount: Math.ceil(total / limit) || 1,
            hasPreviousPage: false,
            hasNextPage: false
          }
        };
      })
    );
  }
}
