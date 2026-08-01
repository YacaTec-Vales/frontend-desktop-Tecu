import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { BadgeComponent } from '../../../components/ui/badge/badge';

@Component({
  selector: 'app-aprobaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, BadgeComponent],
  templateUrl: './aprobaciones.component.html'
})
export class AprobacionesComponent {
  // Bandeja de peticiones
  peticiones = [
    { id: 'PET-101', tipo: 'Dictamen Distribuidora', solicitante: 'Coord. Matriz', descripcion: 'Alta de María López', estado: 'Pendiente' },
    { id: 'PET-102', tipo: 'Aumento de Crédito', solicitante: 'Coord. Norte', descripcion: 'Pre-autorización de Incentivo para DIST-45', estado: 'Pendiente' },
    { id: 'PET-103', tipo: 'Conciliación Manual', solicitante: 'Cajera Matriz', descripcion: 'Descuadre de $50 en corte de caja', estado: 'Pendiente' }
  ];

  isModalOpen = false;
  peticionSeleccionada: any = null;

  abrirModal(peticion: any) {
    this.peticionSeleccionada = peticion;
    this.isModalOpen = true;
  }

  cerrarModal() {
    this.isModalOpen = false;
    this.peticionSeleccionada = null;
  }

  aprobar() {
    if (this.peticionSeleccionada) {
      this.peticionSeleccionada.estado = 'Aprobado';
      this.peticiones = this.peticiones.filter(p => p.estado === 'Pendiente');
      this.cerrarModal();
    }
  }

  rechazar() {
    if (this.peticionSeleccionada) {
      this.peticionSeleccionada.estado = 'Rechazado';
      this.peticiones = this.peticiones.filter(p => p.estado === 'Pendiente');
      this.cerrarModal();
    }
  }
}
