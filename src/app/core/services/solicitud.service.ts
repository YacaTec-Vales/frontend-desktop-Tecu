import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface Solicitud {
  id: string;
  coordinatorId: string;
  verifierId: string;
  branchId: string;
  generalData: {
    rfc: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    fecha_nacimiento?: string;
    lugar_nacimiento?: string;
    calle?: string;
    numero?: string;
    colonia?: string;
    codigo_postal?: string;
    ciudad?: string;
    estado?: string;
    [key: string]: any;
  };
  additionalData: {
    domicilio?: {
      situacion?: string;
      num_recamaras?: number;
      m2_construccion?: number;
      [key: string]: any;
    };
    vehiculos?: any[];
    familiares?: any[];
    referencias_laborales?: any[];
    [key: string]: any;
  };
  verificationPhotos: string[];
  verdict: string;
  verifierComments: string;
  verifiedAt: string;
  status: string;
  distributorId: string | null;
  rejectionReason: string | null;
  solicitationStatusAt: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class SolicitudService {
  private apiUrl = `${environment.apiUrl}/solicitudes`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private buildHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'X-Origin': 'vpn',
      'X-Client-App': 'Tecu'
    });
    const token = this.authService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getSolicitudes(): Observable<Solicitud[]> {
    return this.http.get<{ message: string, data: Solicitud[] }>(this.apiUrl, {
      headers: this.buildHeaders()
    })
      .pipe(map(res => res.data));
  }

  autorizarSolicitud(id: string, payload: { limite_credito_centavos: number, comentarios_decision?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/autorizar`, payload, {
      headers: this.buildHeaders()
    });
  }

  rechazarSolicitud(id: string, payload: { razon: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/rechazar`, payload, {
      headers: this.buildHeaders()
    });
  }
}
