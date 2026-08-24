import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { DocumentService } from './document.service';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const URL_REGEX = /^https?:\/\//i;

/**
 * Servicio auxiliar para resolver `Solicitud.verificationPhotos` (que el
 * backend entrega ya como URLs firmadas frescas) y manejar el caso de
 * URLs expiradas (>15 min) via re-fetch contra
 * `GET /uploads/verification/:solicitationId`.
 *
 * Casos que soporta:
 *  - `items` viene con URLs ya firmadas -> se devuelven tal cual.
 *  - `items` viene con UUIDs (pre-PR #89 o fallback frontend) -> se
 *    resuelve cada uno via `DocumentService.getDocumentById(id)`.
 *  - Mixto -> cada entrada por su camino; el resultado conserva el orden.
 *
 * Si una entrada falla al resolver, se omite silenciosamente y se
 * devuelve el resto (mejor una foto menos que la galeria rota entera).
 */
@Injectable({ providedIn: 'root' })
export class SolicitudPhotosService {
  private readonly documentService = inject(DocumentService);

  /**
   * Resuelve un array de entradas (UUID o URL) a un array de URLs
   * utilizables en `<img [src]="...">`. Las URLs expiradas (>15 min)
   * se pueden refrescar llamando `refreshFromVerification`.
   */
  resolve(items: readonly string[]): Observable<string[]> {
    if (!items || items.length === 0) {
      return of([]);
    }
    const streams = items.map((entry) => this.resolveOne(entry));
    return forkJoin(streams).pipe(
      map((resolved) => resolved.filter((u): u is string => !!u)),
    );
  }

  /**
   * Re-fetch todas las URLs de fotos de una verificacion en una sola
   * llamada al backend. Util cuando una imagen falla por URL expirada
   * y queremos refrescar en bloque.
   */
  refreshFromVerification(solicitationId: string): Observable<string[]> {
    return this.documentService
      .getDocumentsByVerification(solicitationId)
      .pipe(
        map((docs) => docs.map((d) => d.publicUrl).filter((u): u is string => !!u)),
        catchError(() => of([])),
      );
  }

  private resolveOne(entry: string): Observable<string | null> {
    if (!entry) return of(null);
    if (URL_REGEX.test(entry)) return of(entry);
    if (UUID_REGEX.test(entry)) {
      return this.documentService.getDocumentById(entry).pipe(
        map((doc) => doc?.publicUrl ?? null),
        catchError(() => of(null)),
      );
    }
    return of(null);
  }
}