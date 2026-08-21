import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { CardComponent } from '../../../components/ui/card/card';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { BadgeComponent } from '../../../components/ui/badge/badge';

import { BranchService } from '../../../core/services/branch.service';
import { CutService, CutResult } from '../../../core/services/cut.service';
import { Branch } from '../../../core/models/branch.model';

interface BranchCutOutcome {
  branch: Branch;
  status: 'PENDIENTE' | 'EXITOSO' | 'ERROR';
  result?: CutResult;
  errorMessage?: string;
}

@Component({
  selector: 'app-corte-quincena',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, ButtonComponent, ModalComponent, BadgeComponent],
  templateUrl: './corte-quincena.component.html'
})
export class CorteQuincenaComponent implements OnInit {
  sucursales: Branch[] = [];
  selectedBranchIds = new Set<string>();
  cutDate: string = '';
  isLoadingBranches = false;
  isExecuting = false;
  isConfirmModalOpen = false;

  outcomes: BranchCutOutcome[] = [];
  totalExecuted = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private branchService: BranchService,
    private cutService: CutService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarSucursales();
    this.cutDate = this.getDefaultCutDate();
  }

  cargarSucursales() {
    this.isLoadingBranches = true;
    this.errorMessage = '';
    this.branchService.getBranches(1, 100).subscribe({
      next: (res) => {
        this.sucursales = res.data.filter(b => b.isActive);
        this.sucursales.forEach(b => this.selectedBranchIds.add(b.id));
        this.isLoadingBranches = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar sucursales: ' + (err.error?.message || err.message);
        this.isLoadingBranches = false;
        this.cdr.detectChanges();
      }
    });
  }

  getDefaultCutDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    let cutDay: Date;
    if (day <= 15) {
      cutDay = new Date(year, month, 15);
    } else {
      cutDay = new Date(year, month + 1, 0);
    }
    return cutDay.toISOString().split('T')[0];
  }

  toggleBranchSelection(branchId: string) {
    if (this.selectedBranchIds.has(branchId)) {
      this.selectedBranchIds.delete(branchId);
    } else {
      this.selectedBranchIds.add(branchId);
    }
  }

  isSelected(branchId: string): boolean {
    return this.selectedBranchIds.has(branchId);
  }

  selectAll() {
    this.sucursales.forEach(b => this.selectedBranchIds.add(b.id));
    this.cdr.detectChanges();
  }

  deselectAll() {
    this.selectedBranchIds.clear();
    this.cdr.detectChanges();
  }

  get selectedCount(): number {
    return this.selectedBranchIds.size;
  }

  puedeEjecutar(): boolean {
    return this.selectedCount > 0 && !!this.cutDate && !this.isExecuting;
  }

  abrirConfirmacion() {
    if (!this.puedeEjecutar()) return;
    this.errorMessage = '';
    this.successMessage = '';
    this.isConfirmModalOpen = true;
  }

  cancelarConfirmacion() {
    this.isConfirmModalOpen = false;
  }

  ejecutarCorteMasivo() {
    if (!this.puedeEjecutar()) return;

    this.isConfirmModalOpen = false;
    this.isExecuting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.outcomes = this.sucursales
      .filter(b => this.selectedBranchIds.has(b.id))
      .map(b => ({ branch: b, status: 'PENDIENTE' as const }));
    this.totalExecuted = false;

    const requests = this.outcomes.map(outcome =>
      this.cutService.runCut({ branchId: outcome.branch.id, cutDate: this.cutDate }).pipe(
        map((res: any) => {
          outcome.status = 'EXITOSO';
          outcome.result = res.data;
          return outcome;
        }),
        catchError(err => {
          outcome.status = 'ERROR';
          const code = err.error?.error?.code || err.error?.message || err.message || 'Error desconocido';
          
          const map: Record<string, string> = {
            'CUT.NO_VOUCHERS': 'No hay vales registrados en este periodo.',
            'CUT.INVALID_CUT_DATE': 'La fecha de corte no es válida.',
            'CUT.BRANCH_NOT_FOUND': 'Sucursal no encontrada.',
            'CUT.BRANCH_CUTOFF_NOT_FOUND': 'No se encontró config. de corte para esta sucursal.',
          };

          outcome.errorMessage = map[code] ?? code;
          return of(outcome);
        })
      )
    );

    forkJoin(requests).subscribe({
      next: () => {
        this.isExecuting = false;
        this.totalExecuted = true;
        const ok = this.outcomes.filter(o => o.status === 'EXITOSO').length;
        const fail = this.outcomes.filter(o => o.status === 'ERROR').length;
        if (fail === 0) {
          this.successMessage = `Corte ejecutado correctamente en ${ok} sucursal(es).`;
        } else if (ok === 0) {
          this.errorMessage = `No se pudo ejecutar el corte en ninguna de las ${fail} sucursal(es).`;
        } else {
          this.successMessage = `Corte exitoso en ${ok} sucursal(es). ${fail} con error.`;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isExecuting = false;
        this.totalExecuted = true;
        this.errorMessage = 'Error inesperado al procesar el lote.';
        this.cdr.detectChanges();
      }
    });
  }

  get totalRelationsCreated(): number {
    return this.outcomes
      .filter(o => o.status === 'EXITOSO' && o.result)
      .reduce((sum, o) => sum + (o.result?.relationsCreated ?? 0), 0);
  }

  get totalToPayCents(): number {
    return this.outcomes
      .filter(o => o.status === 'EXITOSO' && o.result)
      .reduce((sum, o) => sum + (o.result?.totalToPayCents ?? 0), 0);
  }

  get totalPoints(): number {
    return this.outcomes
      .filter(o => o.status === 'EXITOSO' && o.result)
      .reduce((sum, o) => sum + (o.result?.totalPointsAwarded ?? 0), 0);
  }

  get successCount(): number {
    return this.outcomes.filter(o => o.status === 'EXITOSO').length;
  }

  get errorCount(): number {
    return this.outcomes.filter(o => o.status === 'ERROR').length;
  }

  reiniciar() {
    this.outcomes = [];
    this.totalExecuted = false;
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.detectChanges();
  }
}
