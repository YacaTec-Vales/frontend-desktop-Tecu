import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CardComponent } from '../../../components/ui/card/card';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { VpnOnlyDirective } from '../../../core/directives/vpn-only.directive';

import { CutService, CutResult, CutRelationSummary } from '../../../core/services/cut.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reasignacion',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, ButtonComponent, ModalComponent, BadgeComponent, VpnOnlyDirective],
  templateUrl: './reasignacion.component.html'
})
export class ReasignacionComponent implements OnInit {

  // Datos del gerente autenticado
  branchId: string | null = null;

  // Formulario de corte
  // cutDate se inicializa con la quincena mas cercana (dia 15 o ultimo del mes)
  cutDate: string = '';

  // Estado de ejecucion
  isRunning = false;
  errorMessage = '';

  // Resultado del corte exitoso
  cutResult: CutResult | null = null;

  // Modal de confirmacion (accion destructiva)
  isConfirmModalOpen = false;

  constructor(
    private cutService: CutService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const user = this.authService.currentUser();
    this.branchId = user?.branchId ?? null;
    this.cutDate = this.getDefaultCutDate();
  }

  /**
   * Calcula la fecha de corte por defecto:
   * - Si hoy <= dia 15: sugiere el dia 15 del mes actual
   * - Si hoy > dia 15: sugiere el ultimo dia del mes actual
   */
  getDefaultCutDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    let cutDay: Date;
    if (day <= 15) {
      cutDay = new Date(year, month, 15);
    } else {
      // Ultimo dia del mes
      cutDay = new Date(year, month + 1, 0);
    }

    return cutDay.toISOString().split('T')[0];
  }

  abrirConfirmacion() {
    if (!this.branchId || !this.cutDate) return;
    this.errorMessage = '';
    this.isConfirmModalOpen = true;
  }

  cancelarConfirmacion() {
    this.isConfirmModalOpen = false;
  }

  ejecutarCorte() {
    if (!this.branchId || !this.cutDate) return;

    this.isConfirmModalOpen = false;
    this.isRunning = true;
    this.errorMessage = '';
    this.cutResult = null;

    // POST /api/v1/cuts/run
    this.cutService.runCut({ branchId: this.branchId, cutDate: this.cutDate }).subscribe({
      next: (res) => {
        this.isRunning = false;
        this.cutResult = res.data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isRunning = false;
        const code = err.error?.error?.code || err.error?.message || err.message || '';
        this.errorMessage = this.mapErrorCode(code);
        this.cdr.detectChanges();
      }
    });
  }

  isTriggering = false;
  triggerMessage = '';

  forzarCronJob() {
    this.isTriggering = true;
    this.triggerMessage = '';
    this.cutService.triggerCut().subscribe({
      next: (res) => {
        this.isTriggering = false;
        this.triggerMessage = `Éxito: Se procesaron ${res.data.procesadas} relaciones y hubo ${res.data.errores} errores.`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isTriggering = false;
        this.triggerMessage = 'Error al disparar cron job.';
        this.cdr.detectChanges();
      }
    });
  }

  reiniciar() {
    this.cutResult = null;
    this.errorMessage = '';
    this.cutDate = this.getDefaultCutDate();
  }

  private mapErrorCode(code: string): string {
    const map: Record<string, string> = {
      'CUT.NO_VOUCHERS': 'No hay vales registrados en el periodo seleccionado para esta sucursal.',
      'CUT.INVALID_CUT_DATE': 'La fecha de corte no es válida. Usa el día 15 o el último día del mes.',
      'CUT.BRANCH_NOT_FOUND': 'Sucursal no encontrada.',
      'CUT.BRANCH_CUTOFF_NOT_FOUND': 'No se encontró configuración de corte para esta fecha. Asegúrate de usar el día 15 o el último día del mes.',
    };
    return map[code] ?? `Error al ejecutar el corte: ${code}`;
  }
}
