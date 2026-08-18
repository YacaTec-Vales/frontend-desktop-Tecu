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
  login(credentials: LoginDto): Observable<TokenResponseDto> {
    const sanitizedData = sanitizePayload(credentials);
    
    return this.http.post<{ message: string, data: TokenResponseDto }>(`${this.baseUrl}/login`, sanitizedData).pipe(
      tap(response => {
        const tokens = response.data;
        // Almacenar token en sessionStorage según los requerimientos
        this.setTokens(tokens);
        // La nueva API devuelve el usuario directamente en el TokenResponseDto
        this.currentUser.set(tokens.user);
        this.isAuthenticated.set(true);

        // Medida de seguridad: Destruir sesiones activas en otros navegadores/pestañas
        this.http.post(`${this.baseUrl}/sessions/revoke-others`, {}).subscribe({
          next: () => console.log('Sesiones previas revocadas exitosamente.'),
          error: (err) => console.warn('No se pudieron revocar otras sesiones', err)
        });
      }),
      map(response => response.data),
      catchError(error => {
        // Aquí podrías agregar lógica para mostrar toasts/alertas de error
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene la información del usuario autenticado actual.
   */
  getMe(): Observable<AuthUserResponseDto> {
    return this.http.get<AuthUserResponseDto>(`${this.baseUrl}/me`).pipe(
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
