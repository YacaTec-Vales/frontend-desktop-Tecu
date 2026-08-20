import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  constructor(private http: HttpClient) {}

  getSolicitudes(): Observable<Solicitud[]> {
    return this.http.get<{ message: string, data: Solicitud[] }>(this.apiUrl)
      .pipe(map(res => res.data));
  }

  autorizarSolicitud(id: string, payload: { limite_credito_centavos: number, comentarios_decision?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/autorizar`, payload);
  }

  rechazarSolicitud(id: string, payload: { razon: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/rechazar`, payload);
  }
}
