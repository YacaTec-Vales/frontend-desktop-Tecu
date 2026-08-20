export interface BaseStaff {
  id: string;
  firstName: string;
  lastNamePaternal: string;
  lastNameMaternal: string;
  email: string;
  phone: string;
  branchId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Coordinador extends BaseStaff {}
export interface Verificador extends BaseStaff {}
export interface Cajero extends BaseStaff {}

export interface CreateStaffDto {
  username?: string;
  firstName: string;
  lastNamePaternal: string;
  lastNameMaternal: string;
  email: string;
  phone?: string;
  branchId?: string;
}
