import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

// Entidad que devuelve el API para una categoria de credito.
// Tabla app.category. El campo ganancia esta en basis points (bps).
// Ejemplo: gananciaBps: 600 => 6.00%
export interface CreditCategory {
  id: string;
  nombre: string;
  gananciaBps: number;
}

// DTO para crear una categoria.
export interface CreateCategoryDto {
  nombre: string;
  gananciaBps: number;
}

// DTO para actualizar (PATCH semantico, ambos opcionales).
export interface UpdateCategoryDto {
  nombre?: string;
  gananciaBps?: number;
}

export interface PaginatedCategories {
  data: CreditCategory[];
  meta: {
    page: number;
    limit: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

// NOTA DE INTEGRACION (revision API 2.4)
// La especificacion OpenAPI v2.4 NO expone un endpoint CRUD dedicado para
// categorias de credito (GET/POST/PATCH/DELETE /api/v1/categories).
// El unico endpoint relacionado es:
//   POST /api/v1/distribuidores/{id}/category
//     Payload: { categoryId: string (UUID), motivo: string }
// Ese endpoint CAMBIA la categoria de UN distribuidor, no del catalogo.
//
// Los metodos de este servicio estan listos para cuando el backend
// exponga los endpoints REST estandar del catalogo.
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getCategories(page = 1, limit = 10, search?: string): Observable<PaginatedCategories> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search) params = params.set('search', search);

    return this.http.get<{ message: string; data: any }>(this.apiUrl, { params }).pipe(
      map(res => {
        const raw = res?.data;
        if (Array.isArray(raw)) {
          const filtered = search
            ? raw.filter((c: CreditCategory) => c.nombre.toLowerCase().includes(search.toLowerCase()))
            : raw;
          const start = (page - 1) * limit;
          const sliced = filtered.slice(start, start + limit);
          return {
            data: sliced,
            meta: {
              page, limit,
              itemCount: filtered.length,
              pageCount: Math.ceil(filtered.length / limit) || 1,
              hasPreviousPage: page > 1,
              hasNextPage: (start + limit) < filtered.length
            }
          };
        }
        return {
          data: raw?.data ?? [],
          meta: raw?.meta ?? { page, limit, itemCount: 0, pageCount: 1, hasPreviousPage: false, hasNextPage: false }
        };
      })
    );
  }

  createCategory(dto: CreateCategoryDto): Observable<CreditCategory> {
    return this.http.post<{ message: string; data: CreditCategory }>(this.apiUrl, dto)
      .pipe(map(res => res.data));
  }

  updateCategory(id: string, dto: UpdateCategoryDto): Observable<CreditCategory> {
    return this.http.patch<{ message: string; data: CreditCategory }>(`${this.apiUrl}/${id}`, dto)
      .pipe(map(res => res.data));
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
