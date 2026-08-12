import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { BadgeComponent } from '../../../components/ui/badge/badge';

import { SolicitudService, Solicitud } from '../../../core/services/solicitud.service';
import { CreditRaiseService, CreditRaiseRequest } from '../../../core/services/credit-raise.service';
import { AlertService } from '../../../core/services/alert.service';

type AprobacionTab = 'dictamenes' | 'incrementos';

@Component({
  selector: 'app-aprobaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, BadgeComponent],
  templateUrl: './aprobaciones.component.html'
})
export class AprobacionesComponent implements OnInit {
  activeTab: AprobacionTab = 'dictamenes';
  
  dictamenes: Solicitud[] = [];
  incrementos: CreditRaiseRequest[] = [];
  
  isDictamenesLoaded = false;
  isIncrementosLoaded = false;

  isModalOpen = false;
  selectedItem: any = null;
  isLoading = false;
  
  // Form Variables
  montoAprobacion: number | null = null;
  notasGerencia: string = '';
  
  // Rejection Mode
  isRejectingMode = false;
  motivoRechazo = '';

  constructor(
    private solicitudService: SolicitudService,
    private creditRaiseService: CreditRaiseService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDictamenes();
    this.loadIncrementos();
  }

  setTab(tab: AprobacionTab) {
    this.activeTab = tab;
  }

  loadDictamenes() {
    this.solicitudService.getSolicitudes().subscribe({
      next: (data) => {
        // Filtrar solo las dictaminadas pendientes de autorización
        this.dictamenes = data.filter(d => d.status === 'DICTAMINADA');
        this.isDictamenesLoaded = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isDictamenesLoaded = true;
        this.cdr.detectChanges();
      }
    });
  }

  loadIncrementos() {
    this.creditRaiseService.getPendingRequests().subscribe({
      next: (data) => {
        this.incrementos = data;
        this.isIncrementosLoaded = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isIncrementosLoaded = true;
        this.cdr.detectChanges();
      }
    });
  }

  abrirModal(item: any) {
    this.selectedItem = item;
    this.isModalOpen = true;
    this.notasGerencia = '';
    
    if (this.activeTab === 'incrementos') {
      this.montoAprobacion = item.requestedAmountCents / 100;
    } else {
      this.montoAprobacion = null;
    }
  }

  cerrarModal() {
    this.isModalOpen = false;
    this.selectedItem = null;
    this.montoAprobacion = null;
    this.notasGerencia = '';
    this.isRejectingMode = false;
    this.motivoRechazo = '';
  }

  aprobar() {
    if (!this.selectedItem) return;
    
    if (this.activeTab === 'dictamenes' && (!this.montoAprobacion || this.montoAprobacion <= 0)) {
      this.alertService.warning('Debes asignar un límite de crédito válido mayor a 0.');
      return;
    }

    if (this.activeTab === 'incrementos' && (!this.montoAprobacion || this.montoAprobacion <= 0)) {
      this.alertService.warning('El monto a aprobar debe ser mayor a 0.');
      return;
    }

    this.isLoading = true;

    if (this.activeTab === 'dictamenes') {
      const payload = {
        limite_credito_centavos: (this.montoAprobacion || 0) * 100,
        comentarios_decision: this.notasGerencia
      };

      this.solicitudService.autorizarSolicitud(this.selectedItem.id, payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.alertService.success('Dictamen aprobado exitosamente.');
          this.isDictamenesLoaded = false;
          this.dictamenes = this.dictamenes.filter(d => d.id !== this.selectedItem.id);
          this.cerrarModal();
          this.cdr.detectChanges();
          setTimeout(() => {
            this.isDictamenesLoaded = true;
            this.cdr.detectChanges();
          }, 10);
        },
        error: (err) => {
          this.isLoading = false;
          this.alertService.error(err.error?.message || err.message);
          this.cdr.detectChanges();
        }
      });
    } else if (this.activeTab === 'incrementos') {
      const payload = {
        montoCentavos: (this.montoAprobacion || 0) * 100,
        notas: this.notasGerencia
      };

      this.creditRaiseService.approveRequest(this.selectedItem.id, payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.alertService.success('Aumento aprobado exitosamente.');
          this.isIncrementosLoaded = false;
          this.incrementos = this.incrementos.filter(i => i.id !== this.selectedItem.id);
          this.cerrarModal();
          this.cdr.detectChanges();
          setTimeout(() => {
            this.isIncrementosLoaded = true;
            this.cdr.detectChanges();
          }, 10);
        },
        error: (err) => {
          this.isLoading = false;
          this.alertService.error(err.error?.message || err.message);
          this.cdr.detectChanges();
        }
      });
    }
  }

  iniciarRechazo() {
    this.isRejectingMode = true;
  }

  cancelarRechazo() {
    this.isRejectingMode = false;
    this.motivoRechazo = '';
  }

  rechazar() {
    if (!this.selectedItem) return;
    
    if (!this.motivoRechazo || this.motivoRechazo.trim() === '') {
      this.alertService.error('Debes proporcionar un motivo de rechazo.');
      return;
    }

    this.isLoading = true;

    if (this.activeTab === 'dictamenes') {
      this.solicitudService.rechazarSolicitud(this.selectedItem.id, { razon: this.motivoRechazo }).subscribe({
        next: () => {
          this.isLoading = false;
          this.alertService.success('Dictamen rechazado.');
          this.isDictamenesLoaded = false;
          this.dictamenes = this.dictamenes.filter(d => d.id !== this.selectedItem.id);
          this.cerrarModal();
          this.cdr.detectChanges();
          setTimeout(() => {
            this.isDictamenesLoaded = true;
            this.cdr.detectChanges();
          }, 10);
        },
        error: (err) => {
          this.isLoading = false;
          this.alertService.error(err.error?.message || err.message);
          this.cdr.detectChanges();
        }
      });
    } else if (this.activeTab === 'incrementos') {
      this.creditRaiseService.rejectRequest(this.selectedItem.id, { notas: this.motivoRechazo }).subscribe({
        next: () => {
          this.isLoading = false;
          this.alertService.success('Aumento rechazado.');
          this.isIncrementosLoaded = false;
          this.incrementos = this.incrementos.filter(i => i.id !== this.selectedItem.id);
          this.cerrarModal();
          this.cdr.detectChanges();
          setTimeout(() => {
            this.isIncrementosLoaded = true;
            this.cdr.detectChanges();
          }, 10);
        },
        error: (err) => {
          this.isLoading = false;
          this.alertService.error(err.error?.message || err.message);
          this.cdr.detectChanges();
        }
      });
    }
  }
}
