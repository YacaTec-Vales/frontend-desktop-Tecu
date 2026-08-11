export interface CreateDistribuidorDto {
  solicitudId: string;
}

export interface Distribuidor {
  id: string;
  solicitudId: string;
  createdAt?: string;
  updatedAt?: string;
}
