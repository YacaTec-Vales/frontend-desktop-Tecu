import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { VpnOnlyDirective } from '../../../core/directives/vpn-only.directive';

import { SolicitudService, Solicitud } from '../../../core/services/solicitud.service';
import { CreditRaiseService, CreditRaiseRequest } from '../../../core/services/credit-raise.service';
import { DistribuidorService } from '../../../core/services/distribuidor.service';
import { SolicitudPhotosService } from '../../../core/services/solicitud-photos.service';
import { AlertService } from '../../../core/services/alert.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface UnifiedRequest {
  id: string;
  type: 'ALTA' | 'AUMENTO';
  description: string;
  name: string;
  verdict?: string;
  amount?: number;
  status: string;
  createdAt: Date;
  originalData: any;
}

type FilterType = 'TODAS' | 'ALTAS' | 'AUMENTOS';
@Component({
  selector: 'app-aprobaciones-local',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, BadgeComponent, VpnOnlyDirective],
  templateUrl: './aprobaciones.component.html'
})
export class AprobacionesComponent implements OnInit {
  filterType: FilterType = 'TODAS';

  dictamenes: Solicitud[] = [];
  incrementos: CreditRaiseRequest[] = [];

  unifiedList: UnifiedRequest[] = [];
  filteredList: UnifiedRequest[] = [];

  // Paginación local
  page = 1;
  limit = 10;
  totalItems = 0;
  searchQuery = '';

  loadedCount = 0;
  isDataLoaded = false;
  renderTable = true;

  isModalOpen = false;
  selectedItem: UnifiedRequest | null = null;
  isLoading = false;

  // URLs firmadas resueltas para la galeria de fotos del dictamen
  // seleccionado. Se hidrata en `abrirModal()` via
  // `SolicitudPhotosService.resolve()` y se limpia en `cerrarModal()`.
  resolvedPhotos: string[] = [];

  // Form Variables
  montoAprobacion: number | null = null;
  notasGerencia: string = '';

  trackById(index: number, item: UnifiedRequest): string {
    return item.id;
  }

  get paginatedList() {
    let list = this.filteredList;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    const start = (this.page - 1) * this.limit;
    return list.slice(start, start + this.limit);
  }

  get totalFilteredItems() {
    let list = this.filteredList;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return list.length;
  }

  onPageChange(page: number) {
    this.page = page;
  }

  onSearch(term: string) {
    this.searchQuery = term;
    this.page = 1;
  }

  onLimitChange(limit: number) {
    this.limit = limit;
    this.page = 1;
  }

  // Rejection Mode
  isRejectingMode = false;
  motivoRechazo = '';

  constructor(
    private solicitudService: SolicitudService,
    private creditRaiseService: CreditRaiseService,
    private distribuidorService: DistribuidorService,
    private photoService: SolicitudPhotosService,
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
        this.incrementos = data.filter(i => i.status === 'PENDING');
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
        verdict: d.verdict,
        status: d.status,
        createdAt: new Date(d.createdAt),
        originalData: d
      });
    });

    const fetchObservables = this.incrementos.map(i => {
      return this.distribuidorService.getDistribuidorById(i.distributorId).pipe(
        catchError(() => of(null)), // If error, return null so we don't break forkJoin
        map((distInfo: any) => {
          let name = i.distributorId;
          if (distInfo && distInfo.generalData) {
            name = `${distInfo.generalData.nombre || ''} ${distInfo.generalData.apellido_paterno || ''} ${distInfo.generalData.apellido_materno || ''}`.trim() || name;
          } else if (distInfo && distInfo.user) {
            name = `${distInfo.user.name || ''} ${distInfo.user.lastName || ''} ${distInfo.user.secondLastName || ''}`.trim() || name;
          }

          return {
            id: i.id,
            type: 'AUMENTO' as const,
            description: 'Aumento de Crédito',
            name: name,
            amount: i.requestedAmountCents,
            status: i.status,
            createdAt: new Date(i.createdAt),
            originalData: i
          };
        })
      );
    });

    if (fetchObservables.length > 0) {
      forkJoin(fetchObservables).subscribe((incrementosConNombre: any) => {
        this.unifiedList.push(...(incrementosConNombre as UnifiedRequest[]));
        this.unifiedList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        this.applyFilter();
        this.isLoading = false;
        this.isDataLoaded = true;
        this.cdr.detectChanges();
      });
    } else {
      this.unifiedList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      this.applyFilter();
      this.isDataLoaded = true;
      this.cdr.detectChanges();
    }
  }

  applyFilter() {
    if (this.filterType === 'TODAS') {
      this.filteredList = [...this.unifiedList];
    } else if (this.filterType === 'ALTAS') {
      this.filteredList = this.unifiedList.filter(req => req.type === 'ALTA');
    } else if (this.filterType === 'AUMENTOS') {
      this.filteredList = this.unifiedList.filter(i => i.type === 'AUMENTO');
    }
    this.page = 1; // reset page when filter changes

    this.isLoading = false;
    this.cdr.detectChanges();
  }

  abrirModal(item: UnifiedRequest) {
    this.selectedItem = item;
    this.isModalOpen = true;
    this.notasGerencia = '';

    if (this.selectedItem.type === 'AUMENTO') {
      this.montoAprobacion = this.selectedItem.originalData.requestedAmountCents / 100;
    } else {
      this.montoAprobacion = null;
      // Resuelve verificationPhotos (UUIDs -> URLs firmadas frescas).
      // El backend ya entrega URLs en la respuesta de GET /solicitudes
      // (post PR #98 backend-api), pero mantenemos el resolver por
      // si llegan UUIDs (legacy) o si queremos re-firmar URLs.
      const solicitud = this.selectedItem.originalData as Solicitud;
      const entries = solicitud?.verificationPhotos ?? [];
      if (entries.length > 0) {
        this.photoService.resolve(entries).subscribe({
          next: (urls) => {
            this.resolvedPhotos = urls;
            this.cdr.detectChanges();
          },
          error: () => {
            this.resolvedPhotos = [];
          },
        });
      } else {
        this.resolvedPhotos = [];
      }
    }
  }

  cerrarModal() {
    this.isModalOpen = false;
    this.selectedItem = null;
    this.montoAprobacion = null;
    this.notasGerencia = '';
    this.isRejectingMode = false;
    this.motivoRechazo = '';
    this.resolvedPhotos = [];
  }

  /**
   * Manejador para el evento (error) de <img>: la URL firmada
   * murio (>15 min). Re-fetcheamos todas las URLs de la verificacion.
   */
  onPhotoError(solicitationId: string): void {
    this.photoService.refreshFromVerification(solicitationId).subscribe({
      next: (urls) => {
        this.resolvedPhotos = urls;
        this.cdr.detectChanges();
      },
      error: () => {
        this.resolvedPhotos = [];
      },
    });
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

