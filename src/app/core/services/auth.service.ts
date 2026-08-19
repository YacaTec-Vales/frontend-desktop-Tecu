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
  private apiUrl = 'http://localhost:3000/api/v1';

  constructor(private http: HttpClient) {}

  login(data: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, data);
  }

  setupMfa(token: string): Observable<MfaSetupResponse> {
    return this.http.post<MfaSetupResponse>(`${this.apiUrl}/mfa/setup`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  verifyMfaSetup(token: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/mfa/verify-setup`, { code }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  verifyMfa(token: string, code: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/mfa-verify`, { code }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
