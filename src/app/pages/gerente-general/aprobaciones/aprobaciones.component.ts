import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { BadgeComponent } from '../../../components/ui/badge/badge';

import { SolicitudService, Solicitud } from '../../../core/services/solicitud.service';
import { CreditRaiseService, CreditRaiseRequest } from '../../../core/services/credit-raise.service';

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

  isModalOpen = false;
  selectedItem: any = null;
  isLoading = false;
  errorMessage = '';

  constructor(
    private solicitudService: SolicitudService,
    private creditRaiseService: CreditRaiseService
  ) {}

  ngOnInit() {
    this.loadDictamenes();
    this.loadIncrementos();
  }

  setTab(tab: AprobacionTab) {
    this.activeTab = tab;
  }

  loadDictamenes() {
    this.solicitudService.getSolicitudes().subscribe(data => {
      // Filtrar solo los verificados pendientes de autorización
      this.dictamenes = data.filter(d => d.status === 'VERIFICADO');
    });
  }

  loadIncrementos() {
    this.creditRaiseService.getPendingRequests().subscribe(data => {
      this.incrementos = data;
    });
  }

  abrirModal(item: any) {
    this.selectedItem = item;
    this.isModalOpen = true;
    this.errorMessage = '';
  }

  cerrarModal() {
    this.isModalOpen = false;
    this.selectedItem = null;
    this.errorMessage = '';
  }

  aprobar() {
    if (!this.selectedItem) return;
    this.isLoading = true;

    if (this.activeTab === 'dictamenes') {
      this.solicitudService.autorizarSolicitud(this.selectedItem.id).subscribe({
        next: () => {
          this.isLoading = false;
          this.loadDictamenes();
          this.cerrarModal();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || err.message;
        }
      });
    } else {
      this.creditRaiseService.approveRequest(this.selectedItem.id).subscribe({
        next: () => {
          this.isLoading = false;
          this.loadIncrementos();
          this.cerrarModal();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || err.message;
        }
      });
    }
  }

  rechazar() {
    if (!this.selectedItem) return;
    this.isLoading = true;

    if (this.activeTab === 'dictamenes') {
      this.solicitudService.rechazarSolicitud(this.selectedItem.id).subscribe({
        next: () => {
          this.isLoading = false;
          this.loadDictamenes();
          this.cerrarModal();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || err.message;
        }
      });
    } else {
      this.creditRaiseService.rejectRequest(this.selectedItem.id).subscribe({
        next: () => {
          this.isLoading = false;
          this.loadIncrementos();
          this.cerrarModal();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || err.message;
        }
      });
    }
  }
}
