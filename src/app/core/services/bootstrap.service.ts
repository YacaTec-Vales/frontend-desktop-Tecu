import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of, map, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { BranchService } from './branch.service';
import { StaffService } from './staff.service';

/**
 * Estado del bootstrap del sistema.
 *
 * - `hasMatriz`: indica si ya existe una sucursal con `esMatriz = true`.
 *   El backend enforce unicidad via indice parcial `uq_branch_single_matriz`.
 * - `hasGeneralManager`: indica si ya existe al menos un usuario activo con
 *   rol `GERENTE_GENERAL`. El backend enforce unicidad con lock +
 *   `uq_user_single_active_general_manager`.
 * - `bootstrapComplete`: ambos `true` -> el sistema esta inicializado.
 *
 * Se usa para decidir si el wizard de bootstrap se muestra al admin
 * (`pages/admin/dashboard`) o si debe ir directo a las pantallas operativas.
 */
export interface BootstrapStatus {
  hasMatriz: boolean;
  matrizId?: string | null;
  matrizName?: string | null;
  matrizFolioPrefix?: string | null;
  hasGeneralManager: boolean;
  generalManagerId?: string | null;
  generalManagerName?: string | null;
  generalManagerEmail?: string | null;
  bootstrapComplete: boolean;
}

/**
 * Servicio que centraliza el flujo de bootstrap inicial del sistema.
 *
 * - `getSystemStatus`: detecta si ya existe MATRIZ + GG en backend.
 * - `createMatriz`: wrapper sobre `BranchService.createBranch` que fuerza
 *   `branchType='MATRIZ'` y `esMatriz=true`.
 * - `createGerenteGeneral`: wrapper sobre `StaffService.createGerenteGeneral`
 *   que entrega el payload al backend (ya fuerza `branchId=null`).
 *
 * El admin usa el permiso dedicado `branch.create.matriz` para crear la
 * matriz y `user.create.general_manager` para crear al Gerente General.
 * El backend hace el lock pesimista + enforce unicidad.
 */
@Injectable({
  providedIn: 'root',
})
export class BootstrapService {
  private apiUrl = `${environment.apiUrl}`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private branchService = inject(BranchService);
  private staffService = inject(StaffService);

  /**
   * Headers comunes para las llamadas autenticadas del bootstrap.
   * Usa el token actual (el del admin). Si no hay token, devuelve sin
   * `Authorization` para que el backend responda 401 y propaguemos el
   * error correctamente.
   */
  private buildHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'X-Client-App': 'Tecu' });
    const token = this.authService.getToken();
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  /**
   * Detecta el estado del bootstrap.
   *
   * Implementacion:
   *   1. `GET /branches?esMatriz=true&limit=1` para detectar la MATRIZ.
   *   2. `GET /users?roleCode=GERENTE_GENERAL&limit=1` para detectar el GG.
   *   3. Combinar y devolver el `BootstrapStatus`.
   *
   * Si uno de los endpoints falla, se considera `false` para ese campo
   * (fail-open: el admin vera el wizard y el backend le dira el error
   * concreto al intentar crear).
   */
  getSystemStatus(): Observable<BootstrapStatus> {
    // Sin cache-busting via query param: el backend envia
    // `Cache-Control: no-store` en TODA respuesta JSON, asi que
    // el navegador no debe cachear respuestas viejas.
    //
    // NOTA historica: se intento agregar `_=${Date.now()}` al
    // query string para forzar invalidacion, pero el backend tiene
    // `forbidNonWhitelisted: true` en el ValidationPipe y rechaza
    // cualquier query param no whitelisted con 400 BAD_REQUEST.
    const branchesParams = new HttpParams()
      .set('esMatriz', 'true')
      .set('limit', '1');
    const usersParams = new HttpParams()
      .set('roleCode', 'GERENTE_GENERAL')
      .set('limit', '1');

    const branches$ = this.http
      .get<any>(`${this.apiUrl}/branches`, {
        params: branchesParams,
        headers: this.buildHeaders(),
      })
      .pipe(
        map((res) => {
          const items = res?.data?.data ?? res?.data ?? [];
          const itemCount =
            res?.data?.meta?.itemCount ?? res?.meta?.itemCount ?? items.length;
          return {
            hasMatriz: items.length > 0 || itemCount > 0,
            matrizId: items[0]?.id,
          };
        }),
        catchError(() => of({ hasMatriz: false as boolean, matrizId: undefined })),
      );

    const users$ = this.staffService
      .getUsers(1, 1, 'GERENTE_GENERAL')
      .pipe(
        map((res) => {
          const items = res.data ?? [];
          return {
            hasGeneralManager: items.length > 0,
            generalManagerId: items[0]?.id,
          };
        }),
        catchError(() => of({ hasGeneralManager: false as boolean, generalManagerId: undefined })),
      );

    return forkJoin({ branches: branches$, users: users$ }).pipe(
      map(({ branches, users }) => ({
        hasMatriz: branches.hasMatriz,
        hasGeneralManager: users.hasGeneralManager,
        bootstrapComplete: branches.hasMatriz && users.hasGeneralManager,
        matrizId: branches.matrizId,
        generalManagerId: users.generalManagerId,
      })),
    );
  }

  /**
   * Crea la primera (y unica) sucursal MATRIZ del sistema.
   *
   * Payload esperado (campos minimos):
   *   - name: string (3-100 chars)
   *   - address?: string
   *   - folioPrefix: 3 letras mayusculas
   *   - cutoffDay/paymentDay/earlyPaymentDays?: number
   *
   * El backend exige el permiso `branch.create.matriz` (rol ADMINISTRADOR)
   * o `branch.create` (rol GERENTE_GENERAL).
   */
  createMatriz(payload: {
    name: string;
    address?: string;
    folioPrefix: string;
    cutoffDay?: number;
    paymentDay?: number;
    earlyPaymentDays?: number;
  }): Observable<unknown> {
    return this.branchService.createBranch({
      ...payload,
      branchType: 'MATRIZ',
      esMatriz: true,
    });
  }

  /**
   * Crea al unico Gerente General del sistema.
   *
   * Payload esperado:
   *   - firstName, lastNamePaternal, lastNameMaternal: requeridos
   *   - email: requerido, unico
   *   - username: requerido (3-50 chars, lowercase a-z0-9._-)
   *   - phone?: opcional
   *   - personalData?: objeto libre
   *
   * Backend enforces:
   *   - CHECK `chk_user_gerente_general_branch`: `branchId IS NULL`.
   *   - unicidad: lock pesimista + indice unico parcial.
   *   - El staff.service.ts pone `branchId: null` antes de la peticion.
   */
  createGerenteGeneral(payload: {
    firstName: string;
    lastNamePaternal: string;
    lastNameMaternal: string;
    email: string;
    username: string;
    phone?: string;
  }): Observable<unknown> {
    return this.staffService.createGerenteGeneral(payload);
  }

  /**
   * Transfiere la cualidad de MATRIZ a otra sucursal del sistema.
   *
   * Solo disponible para ADMINISTRADOR (permiso `branch.transfer.matriz`).
   * La sucursal destino pierde su gerente (si lo tenia) porque el GG
   * pertenece unicamente a la MATRIZ.
   *
   * @param branchId - UUID de la sucursal que sera la nueva matriz.
   * @returns Observable con la respuesta del backend (BranchResponse).
   */
  transferMatriz(branchId: string): Observable<unknown> {
    return this.http
      .post<unknown>(
        `${this.apiUrl}/branches/${branchId}/transfer-matriz`,
        {},
        { headers: this.buildHeaders() },
      );
  }
}
