import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { BadgeComponent } from '../../../components/ui/badge/badge';

import { DistribuidorService } from '../../../core/services/distribuidor.service';

@Component({
  selector: 'app-aprobaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, BadgeComponent],
  templateUrl: './aprobaciones.component.html'
})
export class AprobacionesComponent {
  // Bandeja de peticiones (Mock Data temporal hasta que exista GET /api/v1/solicitudes)
  peticiones = [
    { id: '11111111-1111-1111-1111-111111111111', tipo: 'Dictamen Distribuidora', solicitante: 'Coord. Matriz', descripcion: 'Alta de María López', estado: 'Pendiente' },
    { id: 'PET-102', tipo: 'Aumento de Crédito', solicitante: 'Coord. Norte', descripcion: 'Pre-autorización de Incentivo para DIST-45', estado: 'Pendiente' },
    { id: 'PET-103', tipo: 'Conciliación Manual', solicitante: 'Cajera Matriz', descripcion: 'Descuadre de $50 en corte de caja', estado: 'Pendiente' }
  ];

  isModalOpen = false;
  peticionSeleccionada: any = null;
  isLoading = false;
  errorMessage = '';

  constructor(private distribuidorService: DistribuidorService) {}

  abrirModal(peticion: any) {
    this.peticionSeleccionada = peticion;
    this.isModalOpen = true;
    this.errorMessage = '';
  }

  cerrarModal() {
    this.isModalOpen = false;
    this.peticionSeleccionada = null;
    this.errorMessage = '';
  }

  aprobar() {
    if (this.peticionSeleccionada) {
      if (this.peticionSeleccionada.tipo === 'Dictamen Distribuidora') {
        this.isLoading = true;
        // Simulando que el ID de la petición es el solicitudId (UUID)
        this.distribuidorService.createDistribuidor({ solicitudId: this.peticionSeleccionada.id }).subscribe({
          next: () => {
            this.isLoading = false;
            this.marcarComo('Aprobado');
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = 'Hubo un error al comunicarse con la API: ' + (err.message || 'Error desconocido');
          }
        });
      } else {
        // Lógica para los otros tipos de peticiones que no tienen API aún
        this.marcarComo('Aprobado');
      }
    }
  }

  rechazar() {
    if (this.peticionSeleccionada) {
      // Como no hay endpoint de rechazo todavía, solo actualizamos UI local
      this.marcarComo('Rechazado');
    }
  }

  private marcarComo(estado: string) {
    this.peticionSeleccionada.estado = estado;
    this.peticiones = this.peticiones.filter(p => p.estado === 'Pendiente');
    this.cerrarModal();
  }
}
