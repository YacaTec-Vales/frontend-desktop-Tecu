import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { ModalComponent } from '../../../components/ui/modal/modal';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, InputComponent, ButtonComponent, BadgeComponent, ModalComponent],
  templateUrl: './reportes.component.html'
})
export class ReportesComponent {
  // Filtros
  filtroFechaInicio: string = '';
  filtroFechaFin: string = '';
  filtroSucursal: string = '';

  // Datos Dummy
  reporteGlobal = [
    { id: 'DIST-045', nombre: 'María López', sucursal: 'Matriz Principal', calificacion: 'Excelente', morosidad: '$0.00', expediente: 'Completo' },
    { id: 'DIST-089', nombre: 'Juan Pérez', sucursal: 'Sucursal Norte', calificacion: 'Moroso', morosidad: '$1,500.00', expediente: 'Revisión' },
    { id: 'DIST-102', nombre: 'Ana Gómez', sucursal: 'Matriz Principal', calificacion: 'Regular', morosidad: '$0.00', expediente: 'Falta INE' },
    { id: 'DIST-150', nombre: 'Carlos Ruiz', sucursal: 'Sucursal Sur', calificacion: 'Moroso Crítico', morosidad: '$4,200.00', expediente: 'Incompleto' }
  ];

  datosFiltrados = [...this.reporteGlobal];
  
  // Paginación local
  page = 1;
  limit = 10;
  totalItems = 0;
  searchQuery = '';
  
  get paginatedList() {
    let list = this.datosFiltrados;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(item => 
        item.nombre.toLowerCase().includes(q) || 
        item.id.toLowerCase().includes(q) ||
        item.sucursal.toLowerCase().includes(q)
      );
    }
    const start = (this.page - 1) * this.limit;
    return list.slice(start, start + this.limit);
  }

  get totalFilteredItems() {
    let list = this.datosFiltrados;
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(item => 
        item.nombre.toLowerCase().includes(q) || 
        item.id.toLowerCase().includes(q) ||
        item.sucursal.toLowerCase().includes(q)
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

  // Estado del modal de Expediente
  isModalExpedienteOpen = false;
  distribuidoraSeleccionada: any = null;

  aplicarFiltros() {
    // Simulación de filtrado (en backend real usaría las fechas/sucursal)
    this.datosFiltrados = [...this.reporteGlobal];
  }

  limpiarFiltros() {
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.filtroSucursal = '';
    this.datosFiltrados = [...this.reporteGlobal];
    this.page = 1;
  }

  exportarExcel() {
    // Simulación de descarga
    alert('Descargando Reporte_Global.xlsx');
  }

  verExpediente(distribuidora: any) {
    this.distribuidoraSeleccionada = distribuidora;
    this.isModalExpedienteOpen = true;
  }

  cerrarExpediente() {
    this.isModalExpedienteOpen = false;
    this.distribuidoraSeleccionada = null;
  }
}
