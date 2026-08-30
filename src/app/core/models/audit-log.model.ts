/**
 * Modelos del modulo de auditoria. Replican los DTOs del backend
 * NestJS (`/audit/logs` y `/audit/system-logs`).
 */

export type AuditOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditLogItem {
  id: string;
  userId: string | null;
  tableName: string;
  recordId: string;
  operation: AuditOperation;
  action: string | null;
  targetUserId: string | null;
  metadata: Record<string, unknown>;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  changedFields: Record<string, unknown> | null;
  device: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  recordedAt: string;
}

export interface SystemLogItem {
  id: string;
  logType: string;
  userId: string | null;
  action: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  device: string | null;
  durationMs: number | null;
  message: string | null;
  createdAt: string;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export const LOG_TYPES = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'TOKEN_REFRESHED',
  'HTTP_REQUEST',
  'MFA_CHALLENGE_ISSUED',
  'MFA_VERIFIED',
  'MFA_FAILED',
  'EMAIL_DISPATCHED',
  'EMAIL_FAILED',
  'UNAUTHORIZED_ATTEMPT',
  'PERMISSION_DENIED',
  'VPN_GUARD_REJECTED',
  'INTERNAL_ERROR',
] as const;

export type SystemLogType = (typeof LOG_TYPES)[number];
