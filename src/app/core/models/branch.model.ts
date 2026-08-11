export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBranchDto {
  name: string;
  address: string;
  phone: string;
}

export interface UpdateBranchDto {
  name?: string;
  address?: string;
  phone?: string;
}
