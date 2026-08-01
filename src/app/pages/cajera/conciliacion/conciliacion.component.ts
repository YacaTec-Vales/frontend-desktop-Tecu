import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { InputComponent } from '../../../components/ui/input/input';

@Component({
  selector: 'app-conciliacion',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, InputComponent],
  templateUrl: './conciliacion.component.html'
})
export class ConciliacionComponent {
  // Pestañas
  tabActiva: 'automatica' | 'manual' = 'automatica';

  // Simulación de Conciliación Automática
  archivoSeleccionado: boolean = false;
  conciliacionEnProceso: boolean = false;
  resultadoConciliacion: any = null;

  // Bandeja de Conciliación Manual (Pagos no identificados o con error)
  pagosManuales = [
    { id: 'PAG-001', monto: '$1,200.00', fecha: '2023-10-25', motivo: 'Referencia inválida (Folio no encontrado)' },
    { id: 'PAG-002', monto: '$500.00', fecha: '2023-10-26', motivo: 'Monto menor al esperado para REL-402' }
  ];

  isModalOpen = false;
  pagoSeleccionado: any = null;
  folioAsignado: string = '';
  tokenAutorizacion: string = '';

  cambiarTab(tab: 'automatica' | 'manual') {
    this.tabActiva = tab;
  }

  // --- Automática ---
  simularSubidaArchivo() {
    this.archivoSeleccionado = true;
  }

  procesarConciliacion() {
    this.conciliacionEnProceso = true;
    setTimeout(() => {
      this.conciliacionEnProceso = false;
      this.archivoSeleccionado = false;
      this.resultadoConciliacion = {
        exitosos: 45,
        fallidos: 2,
        totalDinero: '$42,500.00'
      };
    }, 2000);
  }

  // --- Manual ---
  abrirModalManual(pago: any) {
    this.pagoSeleccionado = pago;
    this.folioAsignado = '';
    this.tokenAutorizacion = '';
    this.isModalOpen = true;
  }

  cerrarModalManual() {
    this.isModalOpen = false;
    this.pagoSeleccionado = null;
  }

  asignarPago() {
    if (this.tokenAutorizacion.length === 6 && this.folioAsignado) {
      this.pagosManuales = this.pagosManuales.filter(p => p.id !== this.pagoSeleccionado.id);
      this.cerrarModalManual();
    } else {
      alert('Debe ingresar el Folio y un Token de Autorización válido de 6 dígitos.');
    }
  }
}
