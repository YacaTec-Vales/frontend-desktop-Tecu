import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Branch, CreateBranchDto, UpdateBranchDto } from '../models/branch.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private apiUrl = `${environment.apiUrl}/branches`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private buildHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'X-Origin': 'vpn',
      'X-Client-App': 'Tecu'
    });
    const token = this.authService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private buildParams(page: number, limit: number, search?: string): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search) params = params.set('search', search);
    return params;
  }

  getBranches(page: number = 1, limit: number = 100, search?: string): Observable<import('./staff.service').PaginatedResponse<Branch>> {
    return this.http.get<any>(this.apiUrl, { params: this.buildParams(page, limit, search), headers: this.buildHeaders() }).pipe(
      map(res => {
        const dataArr = res?.data?.data || res?.data || [];
        const rawMeta = res?.data?.meta || res?.meta;
        const itemCount = rawMeta?.itemCount ?? rawMeta?.total ?? dataArr.length;
        return {
          data: dataArr,
          meta: {
            ...rawMeta,
            page: rawMeta?.page || page,
            limit: rawMeta?.limit || limit,
            itemCount: itemCount,
            pageCount: rawMeta?.pageCount || Math.ceil(itemCount / limit) || 1
          }
        };
      })
    );
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
