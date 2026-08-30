import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpContext } from '@angular/common/http';
import { AuditService, AuditLogsFilter, SystemLogsFilter } from '../../../core/services/audit.service';
import { StaffService, Gerente } from '../../../core/services/staff.service';
import { AlertService } from '../../../core/services/alert.service';
import { BYPASS_RATE_LIMIT } from '../../../core/interceptors/rate-limit.interceptor';
import { LOG_TYPES, type AuditLogItem, type SystemLogItem } from '../../../core/models/audit-log.model';

type Tab = 'data' | 'system';

/**
 * Visor de auditoria del ADMINISTRADOR.
 *
 * El backend expone dos endpoints:
 *  - `/audit/logs` -> cambios de datos (audit_log). Permiso
 *    `audit.read`.
 *  - `/audit/system-logs` -> eventos del sistema (LOGIN_SUCCESS,
 *    PERMISSION_DENIED, etc.). Login/Logout viven aqui, no en
 *    `/audit/logs`.
 *
 * Los eventos de auditoria devuelven `userId` (UUID) sin email;
 * resolvemos a email con un cache cargado una sola vez desde
 * `GET /users?limit=100` (el admin tiene `user.read`).
 *
 * No existe endpoint de export en el backend, asi que el boton
 * "Exportar" genera CSV client-side sobre lo que ya esta en
 * memoria.
 */
@Component({
  selector: 'app-auditoria',
  imports: [CommonModule, FormsModule],
  templateUrl: './auditoria.component.html',
})
export class AuditoriaComponent implements OnInit {
  private audit = inject(AuditService);
  private staff = inject(StaffService);
  private alert = inject(AlertService);

  readonly tab = signal<Tab>('data');
  readonly isLoading = signal(false);

  // Data tab
  readonly dataRows = signal<AuditLogItem[]>([]);
  readonly dataTotal = signal(0);
  readonly dataPage = signal(1);
  readonly dataLimit = signal(20);
  readonly dataUserId = signal<string>('');
  readonly dataAction = signal<string>('');
  readonly dataStartDate = signal<string>('');
  readonly dataEndDate = signal<string>('');
  readonly expandedDataRow = signal<string | null>(null);

  // System tab
  readonly sysRows = signal<SystemLogItem[]>([]);
  readonly sysTotal = signal(0);
  readonly sysPage = signal(1);
  readonly sysLimit = signal(20);
  readonly sysUserId = signal<string>('');
  readonly sysLogType = signal<string>('');
  readonly sysStartDate = signal<string>('');
  readonly sysEndDate = signal<string>('');
  readonly expandedSysRow = signal<string | null>(null);

  // Mapa userId -> email/nombre (cargado una vez).
  private userCache = signal<Map<string, Gerente>>(new Map());
  readonly LOG_TYPES = LOG_TYPES;

  readonly dataTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.dataTotal() / this.dataLimit())),
  );
  readonly sysTotalPages = computed(() =>
    Math.max(1, Math.ceil(this.sysTotal() / this.sysLimit())),
  );

  ngOnInit(): void {
    this.loadUsers();
    this.loadCurrentTab();
  }

  private loadUsers(): void {
    this.staff
      .getUsers(1, 100, undefined, undefined)
      .subscribe({
        next: (res) => {
          const m = new Map<string, Gerente>();
          for (const u of res.data ?? []) {
            if (u?.id) m.set(u.id, u);
          }
          this.userCache.set(m);
        },
        error: () => {
          // No bloqueante: seguimos mostrando el UUID truncado.
        },
      });
  }

  switchTab(tab: Tab): void {
    if (this.tab() === tab) return;
    this.tab.set(tab);
    this.loadCurrentTab();
  }

  loadCurrentTab(): void {
    if (this.tab() === 'data') {
      this.loadData();
    } else {
      this.loadSystem();
    }
  }

  loadData(): void {
    this.isLoading.set(true);
    const filter: AuditLogsFilter = {
      userId: this.dataUserId() || undefined,
      action: this.dataAction() || undefined,
      startDate: this.toIso(this.dataStartDate()),
      endDate: this.toIso(this.dataEndDate()),
      page: this.dataPage(),
      limit: this.dataLimit(),
    };
    this.audit
      .getAuditLogs(filter)
      .subscribe({
        next: (res) => {
          this.dataRows.set(res.data ?? []);
          this.dataTotal.set(res.meta?.total ?? 0);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.alert.error(
            err?.error?.message ||
              'No se pudieron cargar los registros de auditoria.',
          );
        },
      });
  }

  loadSystem(): void {
    this.isLoading.set(true);
    const filter: SystemLogsFilter = {
      userId: this.sysUserId() || undefined,
      logType: this.sysLogType() || undefined,
      startDate: this.toIso(this.sysStartDate()),
      endDate: this.toIso(this.sysEndDate()),
      page: this.sysPage(),
      limit: this.sysLimit(),
    };
    this.audit
      .getSystemLogs(filter)
      .subscribe({
        next: (res) => {
          this.sysRows.set(res.data ?? []);
          this.sysTotal.set(res.meta?.total ?? 0);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.alert.error(
            err?.error?.message ||
              'No se pudieron cargar los eventos del sistema.',
          );
        },
      });
  }

  applyFilters(): void {
    if (this.tab() === 'data') {
      this.dataPage.set(1);
      this.loadData();
    } else {
      this.sysPage.set(1);
      this.loadSystem();
    }
  }

  clearFilters(): void {
    if (this.tab() === 'data') {
      this.dataUserId.set('');
      this.dataAction.set('');
      this.dataStartDate.set('');
      this.dataEndDate.set('');
    } else {
      this.sysUserId.set('');
      this.sysLogType.set('');
      this.sysStartDate.set('');
      this.sysEndDate.set('');
    }
    this.applyFilters();
  }

  goDataPage(p: number): void {
    const total = this.dataTotalPages();
    if (p < 1 || p > total) return;
    this.dataPage.set(p);
    this.loadData();
  }

  goSysPage(p: number): void {
    const total = this.sysTotalPages();
    if (p < 1 || p > total) return;
    this.sysPage.set(p);
    this.loadSystem();
  }

  toggleData(id: string): void {
    this.expandedDataRow.set(this.expandedDataRow() === id ? null : id);
  }

  toggleSys(id: string): void {
    this.expandedSysRow.set(this.expandedSysRow() === id ? null : id);
  }

  userLabel(id: string | null): string {
    if (!id) return '-';
    const u = this.userCache().get(id);
    if (!u) {
      return id.slice(0, 8) + '...';
    }
    const name = [u.firstName, u.lastNamePaternal].filter(Boolean).join(' ');
    return name ? `${name} <${u.email}>` : u.email;
  }

  operationBadgeClass(op: string): string {
    switch (op) {
      case 'INSERT':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  logTypeBadgeClass(t: string): string {
    if (t.includes('SUCCESS') || t === 'EMAIL_DISPATCHED' || t === 'MFA_VERIFIED') {
      return 'bg-green-100 text-green-800';
    }
    if (
      t.includes('FAILED') ||
      t === 'UNAUTHORIZED_ATTEMPT' ||
      t === 'PERMISSION_DENIED' ||
      t === 'VPN_GUARD_REJECTED'
    ) {
      return 'bg-red-100 text-red-800';
    }
    if (t === 'MFA_CHALLENGE_ISSUED' || t === 'TOKEN_REFRESHED' || t === 'HTTP_REQUEST') {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  }

  /** Genera un CSV en cliente con los registros cargados y dispara descarga. */
  exportCsv(): void {
    const rows = this.tab() === 'data' ? this.dataRows() : this.sysRows();
    if (rows.length === 0) {
      this.alert.info('No hay registros cargados para exportar.');
      return;
    }
    const isData = this.tab() === 'data';
    const header = isData
      ? [
          'Fecha',
          'Usuario',
          'Tabla',
          'Operacion',
          'Accion',
          'RecordId',
          'IP',
          'Device',
          'UserAgent',
        ]
      : ['Fecha', 'Usuario', 'Tipo', 'Accion', 'Mensaje', 'IP', 'Device'];
    const lines = [header.join(',')];
    for (const r of rows) {
      if (isData) {
        const d = r as AuditLogItem;
        lines.push(
          [
            d.recordedAt,
            this.csvField(this.userLabel(d.userId)),
            d.tableName,
            d.operation,
            d.action ?? '',
            d.recordId,
            d.ipAddress ?? '',
            d.device ?? '',
            d.userAgent ?? '',
          ]
            .map((x) => this.csvField(String(x ?? '')))
            .join(','),
        );
      } else {
        const s = r as SystemLogItem;
        lines.push(
          [
            s.createdAt,
            this.csvField(this.userLabel(s.userId)),
            s.logType,
            s.action ?? '',
            s.message ?? '',
            s.ipAddress ?? '',
            s.device ?? '',
          ]
            .map((x) => this.csvField(String(x ?? '')))
            .join(','),
        );
      }
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-${this.tab()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private csvField(value: string): string {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private toIso(date: string): string | undefined {
    if (!date) return undefined;
    // El input type="date" entrega "YYYY-MM-DD". El backend
    // acepta ISO 8601, asi que lo combinamos con inicio/fin de dia.
    return new Date(date + 'T00:00:00').toISOString();
  }
}
