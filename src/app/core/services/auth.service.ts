import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: any;
}

export interface MfaSetupResponse {
  otpauthUrl: string;
  backupCodes: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://apiv2.taquizaschavez.com.mx/api/v1';

  constructor(private http: HttpClient) {}

  login(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, data, {
      headers: {
        'X-Origin': 'vpn',
        'X-Client-App': 'Tecu'
      }
    });
  }

  setupMfa(token: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/mfa/setup`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Origin': 'vpn',
        'X-Client-App': 'Tecu'
      }
    });
  }

  verifyMfaSetup(token: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/mfa/verify-setup`, { code }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Origin': 'vpn',
        'X-Client-App': 'Tecu'
      }
    });
  }

  verifyMfa(token: string, code: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/mfa-verify`, { code }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Origin': 'vpn',
        'X-Client-App': 'Tecu'
      }
    });
  }
}
