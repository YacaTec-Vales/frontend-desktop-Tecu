/**
 * Tipos publicos para Sucursal (branch).
 *
 * `managerUserId` y `manager` son OPCIONALES: el gerente se asigna
 * posteriormente desde el catálogo de Gestión de Personal
 * (Gerentes de Sucursal -> Sucursal Asignada).
 *
 * `cutoffDay`, `paymentDay` y `earlyPaymentDays` los autocomputa el
 * backend al crear la sucursal (matriz desde el wizard de bootstrap
 * del ADMINISTRADOR) o los solicita la UI (catálogo GERENTE_GENERAL).
 *
 * `address` puede ser null (no todas las sucursales tienen direccion
 * capturada al alta).
 */
export interface BranchManager {
  id: string;
  firstName: string;
  lastNamePaternal: string;
  email: string;
}

export interface Branch {
  id: string;
  name: string;
  branchType: 'MATRIZ' | 'SUCURSAL';
  esMatriz: boolean;
  address: string | null;
  managerUserId: string | null;
  manager: BranchManager | null;
  cutoffDay: number;
  paymentDay: number;
  earlyPaymentDays: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Payload para POST /api/v1/branches.
 * - `name`, `branchType` son REQUERIDOS.
 * - `managerUserId` es OPCIONAL (puede omitirse o enviarse como `null`).
 *   El gerente se asigna posteriormente desde Gestión de Personal.
 * - `cutoffDay`, `paymentDay` son requeridos por la UI; el wizard de
 *   bootstrap del ADMINISTRADOR puede omitirlos porque el backend los
 *   autocomputa en ese flujo.
 * - `earlyPaymentDays` lo autocomputa el backend.
 * - `address` opcional.
 */
export interface CreateBranchDto {
  name: string;
  branchType: 'MATRIZ' | 'SUCURSAL';
  esMatriz?: boolean;
  address?: string;
  managerUserId?: string | null;
  cutoffDay?: number;
  paymentDay?: number;
}

/**
 * Payload para PATCH /api/v1/branches/:id. Todos los campos son
 * opcionales (patch parcial), pero si se envian deben respetar
 * las mismas reglas (no negativos, managerUserId UUID).
 * `managerUserId` puede ser `null` para desasignar.
 */
export interface UpdateBranchDto {
  name?: string;
  branchType?: 'MATRIZ' | 'SUCURSAL';
  esMatriz?: boolean;
  address?: string;
  managerUserId?: string | null;
  cutoffDay?: number;
  paymentDay?: number;
}