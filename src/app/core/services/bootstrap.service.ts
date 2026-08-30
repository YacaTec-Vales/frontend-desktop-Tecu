import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Estado del bootstrap del sistema. Lo devuelve el endpoint
 * oficial `GET /admin/bootstrap/status` y el frontend lo
 * mantiene como signal compartido entre el dashboard del admin
 * y el wizard.
 *
 *  - `hasMatriz`: ya existe una sucursal con `esMatriz = true`.
 *  - `hasGeneralManager`: ya existe un usuario activo con rol
 *    `GERENTE_GENERAL`.
 *  - `bootstrapComplete`: ambos `true` -> sistema inicializado.
 *  - El resto de campos son los identificadores basicos que el
 *    dashboard necesita sin disparar mas llamadas.
 */
export interface BootstrapStatus {
  hasMatriz: boolean;
  matrizId?: string | null;
  matrizName?: string | null;
  matrizFolioPrefix?: string | null;
  hasGeneralManager: boolean;
  generalManagerId?: string | null;
  generalManagerName?: string | null;
  generalManagerEmail?: string | null;
  bootstrapComplete: boolean;
}

/**
 * Servicio que centraliza el estado del bootstrap del sistema.
 *
 * - `status` (signal): cache del ultimo estado conocido. Lo leen
 *   dashboard y wizard sin re-pegarle al backend.
 * - `refreshStatus()`: pega contra `GET /admin/bootstrap/status`
 *   (sin cache-busting: el backend ya envia `Cache-Control: no-store`).
 *   En caso de 404 (entpoint no desplegado aun), cae al metodo
 *   legacy basado en `GET /branches` + `GET /users` para no romper
 *   durante el rollout.
 * - `createMatriz` / `createGerenteGeneral` / `transferMatriz`:
 *   wrappers delgados que devuelven la respuesta cruda; el
 *   componente se encarga de desenvolverla.
 */
@Injectable({
  providedIn: 'root',
})
export class BootstrapService {
  private apiUrl = `${environment.apiUrl}`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  /**
   * Estado actual del bootstrap. El dashboard y el wizard lo
   * leen y se re-renderizan al cambiar via `refreshStatus()`.
   */
  readonly status = signal<BootstrapStatus>({
    hasMatriz: false,
    hasGeneralManager: false,
    bootstrapComplete: false,
  });

  private buildHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'X-Client-App': 'Tecu',
    });
    const token = this.authService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /**
   * Llama al endpoint oficial `/admin/bootstrap/status`. Si la
   * respuesta es 404 (backend sin deploy del nuevo modulo),
   * cae al metodo legacy que combinaba `/branches` + `/users`.
   * Asi no rompemos durante el rollout del backend.
   */
  refreshStatus(): Observable<BootstrapStatus> {
    return this.http
      .get<{ data?: BootstrapStatus }>(`${this.apiUrl}/admin/bootstrap/status`, {
        headers: this.buildHeaders(),
      })
      .pipe(
        map((res) => {
          const data = res?.data ?? (res as unknown as BootstrapStatus);
          const normalized = this.normalizeStatus(data);
          this.status.set(normalized);
          return normalized;
        }),
        catchError((err) => {
          if (err?.status === 404) {
            return this.legacyStatus().pipe(map((s) => (this.status.set(s), s)));
          }
          // Cualquier otro error: re-emite el cache actual para no
          // romper la UI con un spinner infinito.
          return of(this.status());
        }),
      );
  }

  /** Wrapper de compatibilidad (legado): NO usar en codigo nuevo. */
  getSystemStatus(): Observable<BootstrapStatus> {
    return this.refreshStatus();
  }

  /**
   * Metodo legacy: dos GETs en paralelo que solo consultan
   * existencia. Se conserva unicamente como fallback durante
   * el rollout.
   */
  private legacyStatus(): Observable<BootstrapStatus> {
    const branchesParams = new HttpParams().set('esMatriz', 'true').set('limit', '1');
    const branches$ = this.http
      .get<any>(`${this.apiUrl}/branches`, {
        params: branchesParams,
        headers: this.buildHeaders(),
      })
      .pipe(
        map((res) => {
          const items = res?.data?.data ?? res?.data ?? [];
          return {
            hasMatriz: items.length > 0,
            matrizId: items[0]?.id ?? null,
            matrizName: items[0]?.name ?? null,
            matrizFolioPrefix: items[0]?.folioPrefix ?? null,
          };
        }),
        catchError(
          () =>
            of({
              hasMatriz: false,
              matrizId: null,
              matrizName: null,
              matrizFolioPrefix: null,
            }),
        ),
      );
    const users$ = this.http
      .get<any>(`${this.apiUrl}/users`, {
        params: new HttpParams().set('roleCode', 'GERENTE_GENERAL').set('limit', '1'),
        headers: this.buildHeaders(),
      })
      .pipe(
        map((res) => {
          const items = res?.data?.data ?? res?.data ?? [];
          return {
            hasGeneralManager: items.length > 0,
            generalManagerId: items[0]?.id ?? null,
            generalManagerName: items[0]?.fullName ?? items[0]?.displayName ?? null,
            generalManagerEmail: items[0]?.email ?? null,
          };
        }),
        catchError(
          () =>
            of({
              hasGeneralManager: false,
              generalManagerId: null,
              generalManagerName: null,
              generalManagerEmail: null,
            }),
        ),
      );
    return new Observable<BootstrapStatus>((sub) => {
      let bDone = false;
      let uDone = false;
      let bResult: any = {};
      let uResult: any = {};
      const next = () => {
        if (!bDone || !uDone) return;
        const combined = this.normalizeStatus({
          hasMatriz: bResult.hasMatriz,
          matrizId: bResult.matrizId,
          matrizName: bResult.matrizName,
          matrizFolioPrefix: bResult.matrizFolioPrefix,
          hasGeneralManager: uResult.hasGeneralManager,
          generalManagerId: uResult.generalManagerId,
          generalManagerName: uResult.generalManagerName,
          generalManagerEmail: uResult.generalManagerEmail,
        });
        sub.next(combined);
        sub.complete();
      };
      branches$.subscribe({
        next: (r) => ((bResult = r), (bDone = true), next()),
      });
      users$.subscribe({
        next: (r) => ((uResult = r), (uDone = true), next()),
      });
    });
  }

  private normalizeStatus(raw: Partial<BootstrapStatus>): BootstrapStatus {
    const hasMatriz = !!raw.hasMatriz;
    const hasGeneralManager = !!raw.hasGeneralManager;
    return {
      hasMatriz,
      matrizId: raw.matrizId ?? null,
      matrizName: raw.matrizName ?? null,
      matrizFolioPrefix: raw.matrizFolioPrefix ?? null,
      hasGeneralManager,
      generalManagerId: raw.generalManagerId ?? null,
      generalManagerName: raw.generalManagerName ?? null,
      generalManagerEmail: raw.generalManagerEmail ?? null,
      bootstrapComplete: hasMatriz && hasGeneralManager,
    };
  }

  createMatriz(payload: {
    name: string;
    address?: string;
    folioPrefix: string;
    branchType: 'MATRIZ';
    esMatriz: true;
    cutoffDay?: number;
    paymentDay?: number;
  }): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/branches`, payload, {
      headers: this.buildHeaders(),
    });
  }

  createGerenteGeneral(payload: {
    firstName: string;
    lastNamePaternal: string;
    lastNameMaternal: string;
    email: string;
    username: string;
    phone?: string;
  }): Observable<unknown> {
    return this.http.post<unknown>(
      `${this.apiUrl}/users`,
      { ...payload, roleCode: 'GERENTE_GENERAL', branchId: null },
      { headers: this.buildHeaders() },
    );
  }

  transferMatriz(branchId: string): Observable<unknown> {
    return this.http
      .post<unknown>(
        `${this.apiUrl}/branches/${branchId}/transfer-matriz`,
        {},
        { headers: this.buildHeaders() },
      );
  }
}
