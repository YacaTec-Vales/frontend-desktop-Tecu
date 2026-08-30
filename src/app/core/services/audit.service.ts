import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import type {
  AuditLogItem,
  PaginatedResponse,
  SystemLogItem,
} from '../models/audit-log.model';

export interface AuditLogsFilter {
  userId?: string;
  tableName?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface SystemLogsFilter {
  userId?: string;
  logType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Servicio para consultar los logs de auditoria. Permiso
 * requerido: `audit.read` (ADMINISTRADOR lo tiene por seed).
 *
 * Endpoints:
 *  - `GET /audit/logs` -> cambios de datos (`audit_log`).
 *  - `GET /audit/system-logs` -> eventos del sistema
 *    (LOGIN_SUCCESS, PERMISSION_DENIED, etc.).
 *
 * NO existe endpoint de export en el backend: la UI genera CSV
 * client-side sobre los resultados cargados.
 */
@Injectable({ providedIn: 'root' })
export class AuditService {
  private apiUrl = `${environment.apiUrl}/audit`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private buildHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'X-Client-App': 'Tecu' });
    const token = this.authService.getToken();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  private buildParams(filter: Record<string, string | number | undefined>): HttpParams {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(filter)) {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    }
    return params;
  }

  /**
   * Devuelve la lista paginada de cambios de datos. El backend
   * envuelve la respuesta en `{ message, data: Paginated<...> }`.
   */
  getAuditLogs(filter: AuditLogsFilter = {}): Observable<PaginatedResponse<AuditLogItem>> {
    const params = this.buildParams({
      userId: filter.userId,
      tableName: filter.tableName,
      action: filter.action,
      startDate: filter.startDate,
      endDate: filter.endDate,
      page: filter.page ?? 1,
      limit: filter.limit ?? 20,
    });
    return this.http
      .get<{ data?: PaginatedResponse<AuditLogItem> }>(`${this.apiUrl}/logs`, {
        headers: this.buildHeaders(),
        params,
      })
      .pipe(map((res) => this.unwrap(res)));
  }

  getSystemLogs(
    filter: SystemLogsFilter = {},
  ): Observable<PaginatedResponse<SystemLogItem>> {
    const params = this.buildParams({
      userId: filter.userId,
      logType: filter.logType,
      startDate: filter.startDate,
      endDate: filter.endDate,
      page: filter.page ?? 1,
      limit: filter.limit ?? 20,
    });
    return this.http
      .get<{ data?: PaginatedResponse<SystemLogItem> }>(`${this.apiUrl}/system-logs`, {
        headers: this.buildHeaders(),
        params,
      })
      .pipe(map((res) => this.unwrap(res)));
  }

  /**
   * El backend responde `{ message, data: { data, meta } }`. Si
   * por algun motivo la respuesta ya viene desenvuelta (modo
   * legacy), se devuelve tal cual.
   */
  private unwrap<T>(res: { data?: T } | T): T {
    const candidate = res as { data?: T };
    if (candidate && typeof candidate === 'object' && 'data' in candidate && candidate.data) {
      return candidate.data;
    }
    return res as T;
  }
}
