import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Coordinador, Verificador, Cajero, CreateStaffDto } from '../models/staff.model';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Coordinadores
  getCoordinadores(): Observable<Coordinador[]> {
    return this.http.get<{message: string, data: Coordinador[]}>(`${this.baseUrl}/coordinadores`).pipe(
      map(res => res.data)
    );
  }

  createCoordinador(data: CreateStaffDto): Observable<Coordinador> {
    return this.http.post<{message: string, data: Coordinador}>(`${this.baseUrl}/coordinadores`, data).pipe(
      map(res => res.data)
    );
  }

  // Verificadores
  getVerificadores(): Observable<Verificador[]> {
    return this.http.get<{message: string, data: Verificador[]}>(`${this.baseUrl}/verificadores`).pipe(
      map(res => res.data)
    );
  }

  createVerificador(data: CreateStaffDto): Observable<Verificador> {
    return this.http.post<{message: string, data: Verificador}>(`${this.baseUrl}/verificadores`, data).pipe(
      map(res => res.data)
    );
  }

  // Cajeros
  getCajeros(): Observable<Cajero[]> {
    return this.http.get<{message: string, data: Cajero[]}>(`${this.baseUrl}/cajeros`).pipe(
      map(res => res.data)
    );
  }

  createCajero(data: CreateStaffDto): Observable<Cajero> {
    return this.http.post<{message: string, data: Cajero}>(`${this.baseUrl}/cajeros`, data).pipe(
      map(res => res.data)
    );
  }
}
