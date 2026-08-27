import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BootstrapService } from '../../../core/services/bootstrap.service';
import { VpnIndicatorComponent } from '../../../core/components/vpn-indicator/vpn-indicator.component';

@Component({
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterModule, VpnIndicatorComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  isSidebarOpen = true;
  private authService = inject(AuthService);
  private router = inject(Router);
  private bootstrapService = inject(BootstrapService);

  /**
   * Estado del bootstrap del sistema. Determina el texto del brand
   * del sidebar:
   *  - Incompleto: "Administrador" (centrado en preparar el sistema).
   *  - Completo:   "Administracion del Sistema" (modo operacion).
   *
   * Se inicializa desde el backend en `ngOnInit` y se refresca cuando
   * el admin navega a una pantalla que pudo haber mutado el estado
   * (ej. /admin/bootstrap).
   */
  readonly bootstrapComplete = signal<boolean>(false);
  readonly isLoadingBootstrap = signal<boolean>(true);

  constructor() {
    void this.refreshBootstrapStatus();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout(): void {
    this.authService.logout();
  }

  /**
   * Consulta el estado actual del bootstrap desde el backend.
   *
   * Pensado para ejecutarse al montar el layout y, opcionalmente,
   * despues de cada navegacion (cuando un admin completa el wizard
   * de bootstrap y vuelve al dashboard, el sidebar debe reflejar el
   * nuevo estado sin F5).
   */
  async refreshBootstrapStatus(): Promise<void> {
    this.isLoadingBootstrap.set(true);
    try {
      const status = await new Promise<{ bootstrapComplete: boolean }>(
        (resolve, reject) => {
          this.bootstrapService.getSystemStatus().subscribe({
            next: (s) => resolve(s),
            error: (e) => reject(e),
          });
        },
      );
      this.bootstrapComplete.set(status.bootstrapComplete);
    } catch {
      // Fail-open: si no podemos consultar el bootstrap asumimos
      // "no completo" para que el admin vea el wizard y no se
      // salte la inicializacion.
      this.bootstrapComplete.set(false);
    } finally {
      this.isLoadingBootstrap.set(false);
    }
  }

  /**
   * Texto del brand del sidebar. Cambia segun el estado del bootstrap.
   */
  readonly brandLabel = (): string =>
    this.bootstrapComplete() ? 'Administracion del Sistema' : 'Administrador';
}
