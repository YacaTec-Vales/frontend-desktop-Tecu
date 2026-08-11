export interface Branch {
  id: string;
  name: string;
  branchType: 'MATRIZ' | 'SUCURSAL';
  esMatriz: boolean;
  address: string | null;
  managerUserId: string | null;
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
