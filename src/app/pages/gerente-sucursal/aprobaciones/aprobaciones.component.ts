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

export interface UnifiedRequest {
  id: string;
  type: 'ALTA' | 'AUMENTO';
  description: string;
  name: string;
  amountOrVerdict: string | number;
  status: string;
  createdAt: Date;
  originalData: any;
}

type FilterType = 'TODAS' | 'ALTAS' | 'AUMENTOS';
@Component({
  selector: 'app-aprobaciones-local',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, BadgeComponent],
  templateUrl: './aprobaciones.component.html'
})
export class AprobacionesComponent implements OnInit {
  filterType: FilterType = 'TODAS';
  
  dictamenes: Solicitud[] = [];
  incrementos: CreditRaiseRequest[] = [];
  
  unifiedList: UnifiedRequest[] = [];
  filteredList: UnifiedRequest[] = [];
  
  loadedCount = 0;
  isDataLoaded = false;

  isModalOpen = false;
  selectedItem: UnifiedRequest | null = null;
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

  setFilter(type: FilterType) {
    this.filterType = type;
    this.applyFilter();
  }

  loadDictamenes() {
    this.solicitudService.getSolicitudes().subscribe({
      next: (data) => {
        this.dictamenes = data.filter(d => d.status === 'DICTAMINADA');
        this.checkIfAllLoaded();
      },
      error: () => {
        this.checkIfAllLoaded();
      }
    });
  }

  loadIncrementos() {
    this.creditRaiseService.getPendingRequests().subscribe({
      next: (data) => {
        this.incrementos = data;
        this.checkIfAllLoaded();
      },
      error: () => {
        this.checkIfAllLoaded();
      }
    });
  }

  checkIfAllLoaded() {
    this.loadedCount++;
    if (this.loadedCount >= 2) {
      this.buildUnifiedList();
    }
  }

  buildUnifiedList() {
    this.unifiedList = [];
    
    this.dictamenes.forEach(d => {
      this.unifiedList.push({
        id: d.id,
        type: 'ALTA',
        description: 'Alta de Distribuidora',
        name: `${d.generalData?.nombre || ''} ${d.generalData?.apellido_paterno || ''}`.trim() || 'Sin Nombre',
        amountOrVerdict: d.verdict,
        status: d.status,
        createdAt: new Date(d.createdAt),
        originalData: d
      });
    });

    this.incrementos.forEach(i => {
      this.unifiedList.push({
        id: i.id,
        type: 'AUMENTO',
        description: 'Aumento de Crédito',
        name: i.distributorId,
        amountOrVerdict: i.requestedAmountCents,
        status: i.status,
        createdAt: new Date(i.createdAt),
        originalData: i
      });
    });

    // Ordenar de más reciente a más antiguo
    this.unifiedList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    this.applyFilter();
    this.isDataLoaded = true;
    this.cdr.detectChanges();
  }

  applyFilter() {
    if (this.filterType === 'TODAS') {
      this.filteredList = [...this.unifiedList];
    } else if (this.filterType === 'ALTAS') {
      this.filteredList = this.unifiedList.filter(req => req.type === 'ALTA');
    } else if (this.filterType === 'AUMENTOS') {
      this.filteredList = this.unifiedList.filter(req => req.type === 'AUMENTO');
    }
  }

  abrirModal(item: UnifiedRequest) {
    this.selectedItem = item;
    this.isModalOpen = true;
    this.notasGerencia = '';
    
    if (this.selectedItem.type === 'AUMENTO') {
      this.montoAprobacion = this.selectedItem.originalData.requestedAmountCents / 100;
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
    
    if (this.selectedItem.type === 'ALTA' && (!this.montoAprobacion || this.montoAprobacion <= 0)) {
      this.alertService.warning('Debes asignar un límite de crédito válido mayor a 0.');
      return;
    }

    if (this.selectedItem.type === 'AUMENTO' && (!this.montoAprobacion || this.montoAprobacion <= 0)) {
      this.alertService.warning('El monto a aprobar debe ser mayor a 0.');
      return;
    }

    this.isLoading = true;

    if (this.selectedItem.type === 'ALTA') {
      const payload = {
        limite_credito_centavos: (this.montoAprobacion || 0) * 100,
        comentarios_decision: this.notasGerencia
      };

      this.solicitudService.autorizarSolicitud(this.selectedItem.id, payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.alertService.success('Dictamen aprobado exitosamente.');
          this.removeItemFromLists(this.selectedItem!.id);
        },
        error: (err) => {
          this.isLoading = false;
          this.alertService.error(err.error?.message || err.message);
          this.cdr.detectChanges();
        }
      });
    } else if (this.selectedItem.type === 'AUMENTO') {
      const payload = {
        montoCentavos: (this.montoAprobacion || 0) * 100,
        notas: this.notasGerencia
      };

      this.creditRaiseService.approveRequest(this.selectedItem.id, payload).subscribe({
        next: () => {
          this.isLoading = false;
          this.alertService.success('Aumento aprobado exitosamente.');
          this.removeItemFromLists(this.selectedItem!.id);
        },
        error: (err) => {
          this.isLoading = false;
          this.alertService.error(err.error?.message || err.message);
          this.cdr.detectChanges();
        }
      });
    }
  }

  private removeItemFromLists(id: string) {
    this.unifiedList = this.unifiedList.filter(i => i.id !== id);
    this.applyFilter();
    this.cerrarModal();
    this.cdr.detectChanges();
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

    if (this.selectedItem.type === 'ALTA') {
      this.solicitudService.rechazarSolicitud(this.selectedItem.id, { razon: this.motivoRechazo }).subscribe({
        next: () => {
          this.isLoading = false;
          this.alertService.success('Dictamen rechazado.');
          this.removeItemFromLists(this.selectedItem!.id);
        },
        error: (err) => {
          this.isLoading = false;
          this.alertService.error(err.error?.message || err.message);
          this.cdr.detectChanges();
        }
      });
    } else if (this.selectedItem.type === 'AUMENTO') {
      this.creditRaiseService.rejectRequest(this.selectedItem.id, { notas: this.motivoRechazo }).subscribe({
        next: () => {
          this.isLoading = false;
          this.alertService.success('Aumento rechazado.');
          this.removeItemFromLists(this.selectedItem!.id);
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

