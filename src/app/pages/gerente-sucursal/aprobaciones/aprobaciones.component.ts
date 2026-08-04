import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { DistribuidorService } from '../../../core/services/distribuidor.service';

@Component({
  selector: 'app-aprobaciones-local',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, BadgeComponent],
  templateUrl: './aprobaciones.component.html'
})
export class AprobacionesComponent {
  private distribuidorService = inject(DistribuidorService);

  peticiones = [
    { id: 'PET-201', tipo: 'Dictamen Local', solicitante: 'Verificador', descripcion: 'Alta de Juan Pérez en Zona 1', estado: 'Pendiente' },
    { id: 'PET-202', tipo: 'Aumento de Crédito', solicitante: 'Coordinador', descripcion: 'Incentivo pre-autorizado para DIST-89', estado: 'Pendiente' },
    { id: 'PET-203', tipo: 'Edición en Caja', solicitante: 'Cajera', descripcion: 'Modificar error ortográfico en INE del cliente final', estado: 'Pendiente' }
  ];

  isModalOpen = false;
  peticionSeleccionada: any = null;
  tokenGenerado: string | null = null;
  isLoading = false;

  abrirModal(peticion: any) {
    this.peticionSeleccionada = peticion;
    this.tokenGenerado = null;
    this.isModalOpen = true;
  }

  cerrarModal() {
    if (this.isLoading) return;
    this.isModalOpen = false;
    this.peticionSeleccionada = null;
    this.tokenGenerado = null;
  }

  aprobar() {
    if (!this.peticionSeleccionada) return;

    if (this.peticionSeleccionada.tipo === 'Edición en Caja') {
      // Lógica de Generación de Token Autorizador (6 dígitos)
      this.tokenGenerado = Math.floor(100000 + Math.random() * 900000).toString();
      this.peticionSeleccionada.estado = 'Aprobado';
      // No cerramos el modal para que el gerente vea el Token y se lo dicte a la cajera
    } else if (this.peticionSeleccionada.tipo === 'Dictamen Local') {
      this.isLoading = true;
      
      // Construir DTO temporal simulando la aprobación de la solicitud
      const mockDto = {
        firstName: 'Nueva',
        lastNamePaternal: 'Distribuidora',
        lastNameMaternal: 'Local',
        email: `distribuidora.local.${Date.now()}@yacatec.test`,
        phone: '5551234567',
        branchId: '', // GS no requiere enviarlo explícitamente si el backend usa su JWT
        solicitudId: 'dummy-solicitud-id-123' // Requerido por el DTO
      };

      this.distribuidorService.createDistribuidor(mockDto).subscribe({
        next: () => {
          this.isLoading = false;
          this.peticionSeleccionada.estado = 'Aprobado';
          this.peticiones = this.peticiones.filter(p => p.estado === 'Pendiente');
          this.cerrarModal();
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error aprobando distribuidora', err);
          alert('Hubo un error al aprobar la distribuidora. ¿Falta de permisos?');
        }
      });
    } else {
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
