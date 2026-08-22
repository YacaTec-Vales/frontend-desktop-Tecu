import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Distribuidor, CreateDistribuidorDto } from '../models/distribuidor.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DistribuidorService {
  private apiUrl = `${environment.apiUrl}/distribuidores`;
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

  createDistribuidor(data: CreateDistribuidorDto): Observable<Distribuidor> {
    return this.http.post<Distribuidor>(this.apiUrl, data, {
      headers: this.buildHeaders()
    });
  }

  changeCategory(id: string, categoryId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/category`, { categoryId, motivo: 'Actualización manual' }, {
      headers: this.buildHeaders()
    });
  }

  changeCoordinator(id: string, coordId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/coord-change`, { coordId }, {
      headers: this.buildHeaders()
    });
  }

  changeBranch(id: string, branchId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/branch-change`, { branchId }, {
      headers: this.buildHeaders()
    });
  }

  getDistribuidores(page: number = 1, limit: number = 100, search?: string): Observable<any> {
    let url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    if (search) url += `&search=${search}`;
    return this.http.get<{ message: string, data: any[], meta: any }>(url, {
      headers: this.buildHeaders()
    });
  }

  getDistribuidorById(id: string): Observable<Distribuidor> {
    return this.http.get<{ message: string, data: Distribuidor }>(`${this.apiUrl}/${id}`, {
      headers: this.buildHeaders()
    })
      .pipe(map((res: any) => res.data || res));
  }
}
