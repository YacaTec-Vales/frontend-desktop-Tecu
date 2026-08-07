import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Solicitud {
  id: string;
  distribuidorId: string;
  status: string;
  createdAt: string;
  // Agrega más campos si es necesario según el API real
}

@Injectable({
  providedIn: 'root'
})
export class SolicitudService {
  private apiUrl = `${environment.apiUrl}/solicitudes`;

  constructor(private http: HttpClient) {}

  getSolicitudes(): Observable<Solicitud[]> {
    return this.http.get<{ message: string, data: Solicitud[] }>(this.apiUrl)
      .pipe(map(res => res.data));
  }

  autorizarSolicitud(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/autorizar`, {});
  }

  rechazarSolicitud(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/rechazar`, {});
  }
}
