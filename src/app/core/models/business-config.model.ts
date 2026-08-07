export interface BusinessConfigItem {
  id: string;
  configKey: string;
  description: string;
  valueCents?: number | null;
  valueBps?: number | null;
  version: number;
}

export interface BusinessConfigPatchItem {
  configKey: string;
  valueCents?: number;
  valueBps?: number;
}

export interface BusinessConfigPatchDto {
  changes: BusinessConfigPatchItem[];
}
