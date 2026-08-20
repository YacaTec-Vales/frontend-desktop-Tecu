export interface Branch {
  id: string;
  name: string;
  branchType: 'MATRIZ' | 'SUCURSAL';
  esMatriz: boolean;
  address: string | null;
  managerUserId?: string | null;
  manager?: {
    id: string;
    firstName: string;
    lastNamePaternal: string;
    email: string;
  } | null;
  cutoffDay: number;
  paymentDay: number;
  earlyPaymentDays: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBranchDto {
  name: string;
  branchType: 'MATRIZ' | 'SUCURSAL';
  esMatriz?: boolean;
  address?: string;
  managerUserId?: string | null;
  cutoffDay?: number;
  paymentDay?: number;
  earlyPaymentDays?: number;
}

export interface UpdateBranchDto {
  name?: string;
  branchType?: 'MATRIZ' | 'SUCURSAL';
  esMatriz?: boolean;
  address?: string;
  managerUserId?: string | null;
  cutoffDay?: number;
  paymentDay?: number;
  earlyPaymentDays?: number;
}
