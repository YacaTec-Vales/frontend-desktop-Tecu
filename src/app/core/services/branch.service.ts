import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Branch, CreateBranchDto, UpdateBranchDto } from '../models/branch.model';

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private apiUrl = `${environment.apiUrl}/branches`;

  constructor(private http: HttpClient) {}

  private buildParams(page: number, limit: number, search?: string): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search) params = params.set('search', search);
    return params;
  }

  getBranches(page: number = 1, limit: number = 100, search?: string): Observable<import('./staff.service').PaginatedResponse<Branch>> {
    return this.http.get<any>(this.apiUrl, { params: this.buildParams(page, limit, search) }).pipe(
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
    return this.http.get<Branch>(`${this.apiUrl}/${id}`);
  }

  createBranch(data: CreateBranchDto): Observable<Branch> {
    return this.http.post<{data: Branch}>(this.apiUrl, data).pipe(
      map(res => res.data)
    );
  }

  updateBranch(id: string, data: UpdateBranchDto): Observable<Branch> {
    return this.http.patch<{data: Branch}>(`${this.apiUrl}/${id}`, data).pipe(
      map(res => res.data)
    );
  }

  deleteBranch(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
