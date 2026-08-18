import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Product {
  id: string;
  code: string;
  variant: string;
  costCents: number;
  totalPeriods: number;
  commissionBps: number;
  insuranceCents: number;
  interestPerPeriodBps: number;
  isActive: boolean;
}

export interface CreateProductDto {
  code: string;
  variant: 'NORMAL' | 'PLUS';
  costCents: number;
  totalPeriods: number;
  commissionBps: number;
  insuranceCents: number;
  interestPerPeriodBps: number;
}

export interface UpdateProductDto {
  code?: string;
  costCents?: number;
  totalPeriods?: number;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  private buildParams(page: number, limit: number, search?: string): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search) params = params.set('search', search);
    return params;
  }

  getProducts(page: number = 1, limit: number = 100, search?: string): Observable<import('./staff.service').PaginatedResponse<Product>> {
    return this.http.get<any>(this.apiUrl, { params: this.buildParams(page, limit, search) })
      .pipe(map(res => ({
        data: res?.data?.data || res?.data || [],
        meta: res?.data?.meta || res?.meta || { page: 1, limit: 100, itemCount: (res?.data?.data || res?.data || []).length, pageCount: 1, hasPreviousPage: false, hasNextPage: false }
      })));
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<{ message: string, data: Product }>(`${this.apiUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  createProduct(data: CreateProductDto): Observable<Product> {
    return this.http.post<{ message: string, data: Product }>(this.apiUrl, data)
      .pipe(map(res => res.data));
  }

  updateProduct(id: string, data: UpdateProductDto): Observable<Product> {
    return this.http.put<{ message: string, data: Product }>(`${this.apiUrl}/${id}`, data)
      .pipe(map(res => res.data));
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
