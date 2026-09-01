import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffService, Gerente } from '../../../core/services/staff.service';
import { BranchService } from '../../../core/services/branch.service';
import { AlertService } from '../../../core/services/alert.service';
import { SYSTEM_ROLES, type SystemRole } from '../../../core/guards/role.guard';
import type { Branch } from '../../../core/models/branch.model';

/**
 * Gestion de usuarios del sistema para el ADMINISTRADOR.
 *
 * El ADMINISTRADOR no tiene alta de personal propia (los da de alta
 * el Gerente General o Gerente de Sucursal segun el rol), pero
 * necesita poder **reenviar las credenciales** cuando un correo de
 * bienvenida se pierde (spam, email mal tipeado, etc.).
 *
 * Por eso esta pagina:
 *  - Lista todos los usuarios del sistema con `GET /users`.
 *  - Permite filtrar por rol y sucursal.
 *  - Ofrece un boton "Reenviar credenciales" por fila que llama a
 *    `POST /users/:id/resend-welcome` (`StaffService.resendWelcome`).
 *    El backend responde `{ emailSent: boolean }`; si el correo fallo,
 *    se reporta al operador para que revise Mailgun.
 *
 * Permisos requeridos en backend: `user.read` o `user.update`. El
 * ADMINISTRADOR tiene `user.read` (al menos para diagnostico).
 */
@Component({
  selector: 'app-admin-usuarios',
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
})
export class UsuariosAdminComponent implements OnInit {
  private staffService = inject(StaffService);
  private branchService = inject(BranchService);
  private alert = inject(AlertService);

  readonly ROLES: readonly SystemRole[] = SYSTEM_ROLES;
  readonly users = signal<Gerente[]>([]);
  readonly branches = signal<Branch[]>([]);

  readonly isLoading = signal(false);
  readonly resendingId = signal<string | null>(null);

  readonly filterRole = signal<string>('');
  readonly filterBranch = signal<string>('');
  readonly searchTerm = signal<string>('');

  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(50);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.limit())),
  );

  ngOnInit(): void {
    this.loadBranches();
    this.load();
  }

  private loadBranches(): void {
    this.branchService.listBranches({ page: 1, limit: 200 }).subscribe({
      next: (res) => this.branches.set(res.data ?? []),
      error: () => this.branches.set([]),
    });
  }

  load(): void {
    this.isLoading.set(true);
    this.staffService
      .getUsers(this.page(), this.limit(), this.filterRole() || undefined, this.searchTerm() || undefined)
      .subscribe({
        next: (res) => {
          this.users.set(this.applyBranchFilter(res.data ?? []));
          this.total.set(res.meta?.itemCount ?? 0);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.alert.error(
            err?.error?.message || 'No se pudieron cargar los usuarios.',
          );
        },
      });
  }

  /**
   * El filtro por sucursal se aplica cliente: el endpoint `GET /users`
   * no acepta `branchId` (los listados por-sucursal viven en
   * `/coordinadores`, `/verificadores`, `/cajeros`). Si el admin
   * selecciona una sucursal, mostramos solo usuarios cuyo `branchId`
   * coincide; los `GERENTE_GENERAL` y `ADMINISTRADOR` (branchId=null)
   * quedan ocultos cuando hay filtro de sucursal activo.
   */
  private applyBranchFilter(rows: Gerente[]): Gerente[] {
    const branch = this.filterBranch();
    if (!branch) return rows;
    return rows.filter((u) => u.branchId === branch);
  }

  onFilterChange(): void {
    this.page.set(1);
    this.load();
  }

  goPage(p: number): void {
    const total = this.totalPages();
    if (p < 1 || p > total) return;
    this.page.set(p);
    this.load();
  }

  branchName(branchId: string | null | undefined): string {
    if (!branchId) return 'MATRIZ';
    const b = this.branches().find((x) => x.id === branchId);
    return b?.name ?? branchId.slice(0, 8) + '...';
  }

  roleLabel(roleCode: string | undefined): string {
    if (!roleCode) return '-';
    return roleCode.replace(/_/g, ' ');
  }

  trackById(_i: number, u: Gerente): string {
    return u.id;
  }

  /**
   * Reenvia el correo de bienvenida al usuario objetivo.
   * El backend genera una contrasena temporal nueva y la envia por
   * correo. Si el operador intenta reenviar muy rapido, el backend
   * responde 429 (`USERS.WELCOME_RESEND_COOLDOWN`) y se muestra el
   * tiempo de espera al admin.
   */
  resendWelcome(u: Gerente): void {
    const nombre =
      `${u.firstName ?? ''} ${u.lastNamePaternal ?? ''}`.trim() || u.email || u.id;
    const ok = confirm(
      `Reenviar credenciales a ${nombre}?\n\nEsto genera una nueva contrasena temporal y envia un nuevo correo a ${u.email}.`,
    );
    if (!ok) return;

    this.resendingId.set(u.id);
    this.staffService.resendWelcome(u.id).subscribe({
      next: (res) => {
        this.resendingId.set(null);
        if (res.emailSent) {
          this.alert.success(`Credenciales reenviadas a ${nombre}.`);
        } else {
          this.alert.warning(
            `Usuario actualizado; el correo fallo. Pide al operador que revise Mailgun.`,
          );
        }
      },
      error: (err) => {
        this.resendingId.set(null);
        const code = err?.error?.error?.code;
        const details = err?.error?.error?.details;
        if (code === 'USERS.WELCOME_RESEND_COOLDOWN') {
          const mins = details?.cooldownMinutes ?? 5;
          this.alert.warning(
            `Espera ${mins} min entre reenvios al mismo usuario.`,
          );
        } else if (code === 'USERS.NOT_FOUND') {
          this.alert.error('Usuario no encontrado.');
        } else if (
          code === 'AUTH.INSUFFICIENT_PERMISSIONS' ||
          code === 'AUTH.PERMISSION_DENIED'
        ) {
          this.alert.error('No tienes permisos para reenviar credenciales.');
        } else {
          this.alert.error(
            err?.error?.message || 'Error al reenviar credenciales.',
          );
        }
      },
    });
  }
}