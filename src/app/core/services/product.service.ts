import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  getProducts(): Observable<Product[]> {
    return this.http.get<{ message: string, data: Product[] }>(this.apiUrl)
      .pipe(map(res => res.data));
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
