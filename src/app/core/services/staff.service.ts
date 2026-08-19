import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Coordinador, Verificador, Cajero, CreateStaffDto } from '../models/staff.model';

export interface Gerente {
  id: string;
  firstName: string;
  lastNamePaternal: string;
  lastNameMaternal: string;
  email: string;
  phone: string;
  branchId: string;
}

import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';

export interface PaginatedMeta {
  page: number;
  limit: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private buildParams(page: number, limit: number, search?: string): HttpParams {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search) {
      params = params.set('search', search);
    }
    return params;
  }

  // Gerentes de Sucursal
  getGerentes(page: number = 1, limit: number = 100, search?: string): Observable<PaginatedResponse<Gerente>> {
    let params = this.buildParams(page, limit, search).set('roleCode', 'GERENTE_SUCURSAL');
    return this.http.get<any>(`${this.baseUrl}/users`, { params }).pipe(
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

  createGerente(data: any): Observable<Gerente> {
    return this.http.post<{data: Gerente}>(`${this.baseUrl}/users`, data).pipe(
      map(res => res.data)
    );
  }

  updateGerente(id: string, data: any): Observable<Gerente> {
    return this.http.patch<{data: Gerente}>(`${this.baseUrl}/users/${id}`, data).pipe(
      map(res => res.data)
    );
  }

  deactivateGerente(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${id}`);
  }

  // Coordinadores
  getCoordinadores(page: number = 1, limit: number = 100, search?: string): Observable<PaginatedResponse<Coordinador>> {
    return this.http.get<any>(`${this.baseUrl}/coordinadores`, { params: this.buildParams(page, limit, search) }).pipe(
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

  createCoordinador(data: CreateStaffDto): Observable<Coordinador> {
    return this.http.post<{data: Coordinador}>(`${this.baseUrl}/coordinadores`, data).pipe(
      map(res => res.data)
    );
  }

  updateCoordinador(id: string, data: any): Observable<Coordinador> {
    return this.http.patch<{data: Coordinador}>(`${this.baseUrl}/coordinadores/${id}`, data).pipe(
      map(res => res.data)
    );
  }

  deactivateCoordinador(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/coordinadores/${id}`);
  }

  // Verificadores
  getVerificadores(page: number = 1, limit: number = 100, search?: string): Observable<PaginatedResponse<Verificador>> {
    return this.http.get<any>(`${this.baseUrl}/verificadores`, { params: this.buildParams(page, limit, search) }).pipe(
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

  createVerificador(data: CreateStaffDto): Observable<Verificador> {
    return this.http.post<{data: Verificador}>(`${this.baseUrl}/verificadores`, data).pipe(
      map(res => res.data)
    );
  }

  updateVerificador(id: string, data: any): Observable<Verificador> {
    return this.http.patch<{data: Verificador}>(`${this.baseUrl}/verificadores/${id}`, data).pipe(
      map(res => res.data)
    );
  }

  deactivateVerificador(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/verificadores/${id}`);
  }

  // Cajeros
  getCajeros(page: number = 1, limit: number = 100, search?: string): Observable<PaginatedResponse<Cajero>> {
    return this.http.get<any>(`${this.baseUrl}/cajeros`, { params: this.buildParams(page, limit, search) }).pipe(
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

  createCajero(data: CreateStaffDto): Observable<Cajero> {
    return this.http.post<{data: Cajero}>(`${this.baseUrl}/cajeros`, data).pipe(
      map(res => res.data)
    );
  }

  updateCajero(id: string, data: any): Observable<Cajero> {
    return this.http.patch<{data: Cajero}>(`${this.baseUrl}/cajeros/${id}`, data).pipe(
      map(res => res.data)
    );
  }

  deactivateCajero(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cajeros/${id}`);
  }
}
