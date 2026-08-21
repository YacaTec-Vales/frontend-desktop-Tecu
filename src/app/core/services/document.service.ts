import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

// Entidad DocumentResponse segun API v2.5
// GET /api/v1/uploads/{id}
// GET /api/v1/uploads/client/{clientId}
// GET /api/v1/uploads/verification/{solicitationId}
// GET /api/v1/uploads/type/{documentType}
export interface DocumentResponse {
  id: string;
  documentType: string;   // 'ine', 'address_proof', 'voucher_evidence', etc.
  fileName: string;
  storagePath: string;
  publicUrl: string;      // URL firmada lista para renderizar
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string | null;
  uploadedBy: string;
  metadata: Record<string, any>;
  isActive: boolean;
  createdAt: string;
}

// Resultado de subir un documento (POST /api/v1/uploads)
export interface UploadResult {
  id: string;
  publicUrl: string;
  fileName: string;
  documentType: string;
  mimeType: string;
  sizeBytes: number;
}

// Tipos de documento conocidos
export type KnownDocumentType =
  | 'ine'
  | 'address_proof'
  | 'voucher_evidence'
  | 'conciliacion_evidence'
  | 'photo_verification'
  | string;

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly uploadsUrl = `${environment.apiUrl}/uploads`;
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

  // POST /api/v1/uploads
  // Sube un archivo generico al storage.
  uploadFile(
    file: File,
    documentType: KnownDocumentType,
    metadata?: Record<string, any>
  ): Observable<DocumentResponse> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('documentType', documentType);
    if (metadata) {
      form.append('metadata', JSON.stringify(metadata));
    }
    return this.http
      .post<{ message: string; data: DocumentResponse }>(this.uploadsUrl, form, {
        headers: this.buildHeaders()
      })
      .pipe(map(res => res.data));
  }

  // POST /api/v1/uploads/verification/{solicitationId}
  // Sube una foto de verificacion asociada a una solicitud.
  uploadVerificationPhoto(
    solicitationId: string,
    file: File,
    documentType: KnownDocumentType = 'photo_verification'
  ): Observable<DocumentResponse> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('documentType', documentType);
    return this.http
      .post<{ message: string; data: DocumentResponse }>(
        `${this.uploadsUrl}/verification/${solicitationId}`,
        form,
        { headers: this.buildHeaders() }
      )
      .pipe(map(res => res.data));
  }

  // GET /api/v1/uploads/{id}
  getDocumentById(id: string): Observable<DocumentResponse> {
    return this.http
      .get<{ message: string; data: DocumentResponse }>(`${this.uploadsUrl}/${id}`, {
        headers: this.buildHeaders()
      })
      .pipe(map(res => res.data));
  }

  // GET /api/v1/uploads/client/{clientId}
  // Documentos de un cliente (INE, comprobante, etc.)
  getDocumentsByClient(clientId: string): Observable<DocumentResponse[]> {
    return this.http
      .get<{ message: string; data: DocumentResponse[] }>(
        `${this.uploadsUrl}/client/${clientId}`,
        { headers: this.buildHeaders() }
      )
      .pipe(map(res => res.data ?? []));
  }

  // GET /api/v1/uploads/verification/{solicitationId}
  // Documentos/fotos de una solicitud de verificacion.
  getDocumentsByVerification(solicitationId: string): Observable<DocumentResponse[]> {
    return this.http
      .get<{ message: string; data: DocumentResponse[] }>(
        `${this.uploadsUrl}/verification/${solicitationId}`,
        { headers: this.buildHeaders() }
      )
      .pipe(map(res => res.data ?? []));
  }

  // GET /api/v1/uploads/type/{documentType}
  // Lista todos los documentos de un tipo especifico.
  getDocumentsByType(documentType: KnownDocumentType): Observable<DocumentResponse[]> {
    return this.http
      .get<{ message: string; data: DocumentResponse[] }>(
        `${this.uploadsUrl}/type/${documentType}`,
        { headers: this.buildHeaders() }
      )
      .pipe(map(res => res.data ?? []));
  }

  // Helper: determina si el mimeType corresponde a imagen
  isImage(mimeType: string): boolean {
    return mimeType?.startsWith('image/');
  }

  // Helper: determina si el mimeType corresponde a PDF
  isPdf(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }

  // Helper: devuelve icono/etiqueta amigable para el tipo de documento
  labelForType(documentType: string): string {
    const labels: Record<string, string> = {
      ine: 'INE',
      address_proof: 'Comprobante de Domicilio',
      voucher_evidence: 'Evidencia de Vale',
      conciliacion_evidence: 'Evidencia de Conciliacion',
      photo_verification: 'Foto de Verificacion'
    };
    return labels[documentType] ?? documentType;
  }
}
