import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';
import { BadgeComponent } from '../../../components/ui/badge/badge';

@Component({
  selector: 'app-reportes-local',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, InputComponent, ButtonComponent, BadgeComponent],
  templateUrl: './reportes.component.html'
})
export class ReportesComponent {
  // Filtros
  filtroFecha: string = '';
  filtroDistribuidora: string = '';

  // Datos de Relaciones
  relaciones = [
    { folio: 'REL-401', distribuidora: 'María López', totalOtorgado: '$12,000.00', pagoQuincenal: '$1,200.00', estado: 'Al Corriente' },
    { folio: 'REL-402', distribuidora: 'Pedro Gómez', totalOtorgado: '$5,000.00', pagoQuincenal: '$500.00', estado: 'Atrasado' },
    { folio: 'REL-403', distribuidora: 'Ana Martínez', totalOtorgado: '$8,500.00', pagoQuincenal: '$850.00', estado: 'Al Corriente' }
  ];

  datosFiltrados = [...this.relaciones];
  
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
        item.folio.toLowerCase().includes(q) || 
        item.distribuidora.toLowerCase().includes(q)
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
        item.folio.toLowerCase().includes(q) || 
        item.distribuidora.toLowerCase().includes(q)
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

  aplicarFiltros() {
    this.datosFiltrados = [...this.relaciones];
  }

  limpiarFiltros() {
    this.filtroFecha = '';
    this.filtroDistribuidora = '';
    this.datosFiltrados = [...this.relaciones];
    this.page = 1;
  }
}
