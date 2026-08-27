import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BootstrapService, BootstrapStatus } from '../../../core/services/bootstrap.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Dashboard principal del ADMINISTRADOR.
 *
 * - Lee `BootstrapService.getSystemStatus()` al cargar para saber si el
 *   sistema esta inicializado (MATRIZ + GG creados).
 * - Si NO esta inicializado: card grande con CTA al wizard de bootstrap.
 * - Si YA esta inicializado: tres cards con el estado real y un CTA para
 *   transferir la cualidad de MATRIZ a otra sucursal.
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
  private cdr = inject(ChangeDetectorRef);

  status: BootstrapStatus | null = null;
  isLoading = true;
  error = '';

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.isLoading = true;
    this.error = '';
    this.bootstrapService.getSystemStatus().subscribe({
      next: (s) => {
        this.status = s;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error =
          err?.error?.message ||
          'Error al consultar el estado del sistema. Intente nuevamente.';
        this.isLoading = false;
        this.cdr.detectChanges();
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

  /**
   * Navega al wizard de bootstrap en modo "transferir matriz".
   * El wizard detecta que ya existe MATRIZ y muestra el formulario
   * de transferencia en lugar del wizard de creacion inicial.
   */
  goToTransferMatriz(): void {
    this.router.navigate(['/admin/bootstrap'], {
      queryParams: { mode: 'transfer-matriz' },
    });
  }
}
