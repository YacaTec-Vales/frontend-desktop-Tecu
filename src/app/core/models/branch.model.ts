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
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBranchDto {
  name: string;
  branchType: 'MATRIZ' | 'SUCURSAL';
  esMatriz?: boolean;
  address?: string;
  managerUserId?: string;
}

export interface UpdateBranchDto {
  name?: string;
  branchType?: 'MATRIZ' | 'SUCURSAL';
  esMatriz?: boolean;
  address?: string;
  managerUserId?: string;
}
