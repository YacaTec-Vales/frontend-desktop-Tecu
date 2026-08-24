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
  penaltyCents: number;
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
  penaltyCents: number;
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
    let params = new HttpParams();
    // No enviamos page y limit al backend porque tira 400 BAD REQUEST 
    // si no tiene el DTO actualizado. Haremos la paginación local en el map.
    // OJO: Tampoco enviamos search si el backend de products no lo soporta.
    // De momento lo quitamos todo para asegurar que devuelva los datos sin caerse.
    return params;
  }

  getProducts(page: number = 1, limit: number = 100, search?: string): Observable<import('./staff.service').PaginatedResponse<Product>> {
    return this.http.get<any>(this.apiUrl, { params: this.buildParams(page, limit, search) })
      .pipe(map(res => {
        let allData = res?.data?.data || res?.data || [];
        if (search) {
          const lowerSearch = search.toLowerCase();
          allData = allData.filter((p: any) => p.code?.toLowerCase().includes(lowerSearch) || p.variant?.toLowerCase().includes(lowerSearch));
        }
        const total = allData.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const slicedData = allData.slice(startIndex, endIndex);

        return {
          data: slicedData,
          meta: { 
            page, 
            limit, 
            itemCount: total, 
            pageCount: Math.ceil(total / limit) || 1, 
            hasPreviousPage: page > 1, 
            hasNextPage: endIndex < total 
          }
        };
      }));
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
