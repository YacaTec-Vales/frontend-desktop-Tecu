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

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Gerentes de Sucursal
  getGerentes(): Observable<Gerente[]> {
    return this.http.get<{data: {data: Gerente[]}}>(`${this.baseUrl}/users?roleCode=GERENTE_SUCURSAL`).pipe(
      map(res => res.data.data)
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
  getCoordinadores(): Observable<Coordinador[]> {
    return this.http.get<{data: {data: Coordinador[]}}>(`${this.baseUrl}/coordinadores`).pipe(
      map(res => res.data.data)
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
  getVerificadores(): Observable<Verificador[]> {
    return this.http.get<{data: {data: Verificador[]}}>(`${this.baseUrl}/verificadores`).pipe(
      map(res => res.data.data)
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
  getCajeros(): Observable<Cajero[]> {
    return this.http.get<{data: {data: Cajero[]}}>(`${this.baseUrl}/cajeros`).pipe(
      map(res => res.data.data)
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
