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
}
