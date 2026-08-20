import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { LoginDto, TokenResponseDto, AuthUserResponseDto } from '../models/auth.dto';
import { sanitizePayload } from '../utils/sanitizer.util';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  
  // Utiliza la URL configurada en los archivos de environment (variables de entorno)
  private readonly baseUrl = `${environment.apiUrl}/auth`; 


  // Señales para manejar el estado reactivo del usuario
  public currentUser = signal<AuthUserResponseDto | null>(null);
  public isAuthenticated = signal<boolean>(false);

  constructor() {
    // Si la app recarga y hay token en sessionStorage, intentamos recuperar la sesión
    this.checkInitialStatus();
  }

  /**
   * Procesa el inicio de sesión.
   * Sanitiza las credenciales antes de enviarlas al backend.
   */
  login(credentials: LoginDto): Observable<any> {
    const sanitizedData = sanitizePayload(credentials);
    
    return this.http.post<any>(`${this.baseUrl}/login`, sanitizedData, {
      headers: {
        'X-Origin': 'vpn',
        'X-Client-App': 'Tecu'
      }
    }).pipe(
      tap(response => {
        // We only set tokens fully if not requiring MFA
        if (!response.data.mfaRequired && response.data.user?.mfaEnabled !== false) {
          const tokens = response.data;
          this.setTokens(tokens);
          this.currentUser.set(tokens.user);
          this.isAuthenticated.set(true);

          this.http.post(`${this.baseUrl}/sessions/revoke-others`, {}).subscribe({
            next: () => console.log('Sesiones previas revocadas exitosamente.'),
            error: (err) => console.warn('No se pudieron revocar otras sesiones', err)
          });
        }
      }),
      map(response => response),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  setupMfa(token: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/mfa/setup`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Origin': 'vpn',
        'X-Client-App': 'Tecu'
      }
    });
  }

  verifyMfaSetup(token: string, code: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/mfa/verify-setup`, { code }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Origin': 'vpn',
        'X-Client-App': 'Tecu'
      }
    });
  }

  verifyMfa(token: string, code: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/mfa-verify`, { code }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Origin': 'vpn',
        'X-Client-App': 'Tecu'
      }
    });
  }

  /**
   * Obtiene la información del usuario autenticado actual.
   */
  getMe(): Observable<AuthUserResponseDto> {
    return this.http.get<{ message: string, data: AuthUserResponseDto }>(`${this.baseUrl}/me`).pipe(
      map(res => res.data),
      tap(user => {
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      })
    );
  }

  /**
   * Cierra sesión en el backend y limpia el sessionStorage.
   */
  logout(): void {
    // El backend requiere un payload vacio o con refreshToken si existe
    // En este caso mandaremos un objeto vacio, pero podríamos mandar { refreshToken: ... } si se guardó
    this.http.post(`${this.baseUrl}/logout`, {}).pipe(
      catchError(() => {
        // Aunque falle la llamada al backend, limpiamos el cliente
        return [];
      })
    ).subscribe(() => {
      this.clearSession();
      this.router.navigate(['/login']);
    });
  }

  /**
   * Helper para limpiar todo rastro de la sesión en el frontend.
   * Útil cuando expira la sesión (401) para forzar el logout sin llamar al backend.
   */
  forceLogout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return sessionStorage.getItem('ACCESS_TOKEN');
  }

  private setTokens(tokens: TokenResponseDto): void {
    sessionStorage.setItem('ACCESS_TOKEN', tokens.accessToken);
    if (tokens.refreshToken) {
      sessionStorage.setItem('REFRESH_TOKEN', tokens.refreshToken);
    }
  }

  private clearSession(): void {
    sessionStorage.removeItem('ACCESS_TOKEN');
    sessionStorage.removeItem('REFRESH_TOKEN');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  /**
   * Decodifica el token JWT y verifica si ya ha expirado localmente.
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload || !payload.exp) return false;
      const exp = payload.exp * 1000; // Segundos a milisegundos
      return Date.now() >= exp;
    } catch (e) {
      return true; // Formato inválido
    }
  }

  private checkInitialStatus(): void {
    if (this.getToken()) {
      if (this.isTokenExpired()) {
        this.clearSession();
      } else {
        this.isAuthenticated.set(true);
      }
    }
  }
}
