import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Branch, CreateBranchDto, UpdateBranchDto } from '../models/branch.model';
import { AuthService } from './auth.service';

/**
 * Filtros soportados por `GET /branches`.
 *
 * El backend expone (ver `ListBranchesQueryDto`):
 *  - `page`, `limit`, `search` (basico).
 *  - `esMatriz` (true/false) — usado por el wizard de bootstrap
 *    para listar candidatas a convertirse en nueva MATRIZ.
 *  - `branchType` ('MATRIZ' | 'SUCURSAL').
 *  - `isActive` (true/false).
 */
export interface ListBranchesFilters {
  page?: number;
  limit?: number;
  search?: string;
  esMatriz?: boolean;
  branchType?: 'MATRIZ' | 'SUCURSAL';
  isActive?: boolean;
}

/**
 * Respuesta cruda del backend `GET /branches`.
 *
 * El backend devuelve `{ message, data: { data: Branch[], meta } }` o
 * `{ data: Branch[] }` segun el endpoint. Esta interfaz es la union
 * tolerante que el frontend usa para abstraer la forma.
 */
export interface PaginatedBranches {
  data: Branch[];
  meta: {
    page: number;
    limit: number;
    itemCount: number;
    pageCount: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private apiUrl = `${environment.apiUrl}/branches`;
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

  private buildParams(filters: ListBranchesFilters): HttpParams {
    let params = new HttpParams()
      .set('page', (filters.page ?? 1).toString())
      .set('limit', (filters.limit ?? 100).toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.esMatriz !== undefined) {
      params = params.set('esMatriz', filters.esMatriz ? 'true' : 'false');
    }
    if (filters.branchType) params = params.set('branchType', filters.branchType);
    if (filters.isActive !== undefined) {
      params = params.set('isActive', filters.isActive ? 'true' : 'false');
    }
    return params;
  }

  /**
   * Variante moderna con filtros declarativos. Usada por el wizard
   * de bootstrap y dashboards.
   */
  listBranches(filters: ListBranchesFilters): Observable<PaginatedBranches> {
    return this.http.get<any>(this.apiUrl, {
      params: this.buildParams(filters),
      headers: this.buildHeaders(),
    }).pipe(
      map(res => {
        const dataArr = res?.data?.data || res?.data || [];
        const rawMeta = res?.data?.meta || res?.meta;
        const itemCount = rawMeta?.itemCount ?? rawMeta?.total ?? dataArr.length;
        return {
          data: dataArr,
          meta: {
            page: rawMeta?.page || filters.page || 1,
            limit: rawMeta?.limit || filters.limit || 100,
            itemCount,
            pageCount: rawMeta?.pageCount || Math.ceil(itemCount / (filters.limit ?? 100)) || 1,
          },
        };
      }),
    );
  }

  /**
   * Wrapper compatible con codigo legado.
   */
  getBranches(page: number = 1, limit: number = 100, search?: string): Observable<PaginatedBranches> {
    return this.listBranches({ page, limit, search });
  }

  getBranch(id: string): Observable<Branch> {
    return this.http.get<Branch>(`${this.apiUrl}/${id}`, { headers: this.buildHeaders() });
  }

  createBranch(data: CreateBranchDto): Observable<Branch> {
    return this.http.post<{data: Branch}>(this.apiUrl, data, { headers: this.buildHeaders() }).pipe(
      map(res => res.data)
    );
  }

  updateBranch(id: string, data: UpdateBranchDto): Observable<Branch> {
    return this.http.patch<{data: Branch}>(`${this.apiUrl}/${id}`, data, { headers: this.buildHeaders() }).pipe(
      map(res => res.data)
    );
  }

  deleteBranch(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.buildHeaders() });
  }
}
