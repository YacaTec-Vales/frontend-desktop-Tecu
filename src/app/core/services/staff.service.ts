import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    return this.http.get<Coordinador[]>(`${this.baseUrl}/coordinadores`);
  }

  createCoordinador(data: CreateStaffDto): Observable<Coordinador> {
    return this.http.post<Coordinador>(`${this.baseUrl}/coordinadores`, data);
  }

  // Verificadores
  getVerificadores(): Observable<Verificador[]> {
    return this.http.get<Verificador[]>(`${this.baseUrl}/verificadores`);
  }

  createVerificador(data: CreateStaffDto): Observable<Verificador> {
    return this.http.post<Verificador>(`${this.baseUrl}/verificadores`, data);
  }

  // Cajeros
  getCajeros(): Observable<Cajero[]> {
    return this.http.get<Cajero[]>(`${this.baseUrl}/cajeros`);
  }

  createCajero(data: CreateStaffDto): Observable<Cajero> {
    return this.http.post<Cajero>(`${this.baseUrl}/cajeros`, data);
  }
}
