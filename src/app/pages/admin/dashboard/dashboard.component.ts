import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BootstrapService } from '../../../core/services/bootstrap.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';

/**
 * Dashboard principal del ADMINISTRADOR.
 *
 * - Lee el signal compartido `BootstrapService.status()` para
 *   evitar parpadeos al volver del wizard (la data no se re-pide
 *   si el wizard ya la refresco).
 * - `ngOnInit` dispara `refreshStatus()` para que el backend sea
 *   la fuente de verdad (envia `Cache-Control: no-store`).
 * - El estado `isLoading` se activa solo durante la peticion
 *   inicial; cuando ya tenemos cache, el dashboard se muestra
 *   de inmediato y se actualiza silenciosamente.
 */
@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private bootstrapService = inject(BootstrapService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private alert = inject(AlertService);

  readonly status = computed(() => this.bootstrapService.status());
  private hasCache = computed(() => {
    const s = this.status();
    return s.hasMatriz || s.hasGeneralManager;
  });
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  readonly showSkeleton = computed(
    () => this.isLoading() && !this.hasCache(),
  );

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    // Si ya tenemos cache, no mostramos el spinner completo:
    // dejamos la UI visible y solo refrescamos en background.
    if (!this.hasCache()) {
      this.isLoading.set(true);
    }
    this.error.set(null);
    this.bootstrapService.refreshStatus().subscribe({
      next: () => this.isLoading.set(false),
      error: (err) => {
        this.isLoading.set(false);
        const msg =
          err?.error?.message ||
          'No se pudo consultar el estado del sistema. Intente nuevamente.';
        this.error.set(msg);
        this.alert.error(msg);
      },
    });
  }

  get displayName(): string {
    const u = this.authService.currentUser();
    return u?.displayName || u?.username || u?.email || 'Administrador';
  }

  goToBootstrap(): void {
    this.router.navigate(['/admin/bootstrap']);
  }

  goToTransferMatriz(): void {
    this.router.navigate(['/admin/bootstrap'], {
      queryParams: { mode: 'transfer-matriz' },
    });
  }

  goToSucursales(): void {
    this.router.navigate(['/admin/sucursales']);
  }
}
