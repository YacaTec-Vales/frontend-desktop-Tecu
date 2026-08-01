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

  aplicarFiltros() {
    this.datosFiltrados = [...this.relaciones];
  }

  limpiarFiltros() {
    this.filtroFecha = '';
    this.filtroDistribuidora = '';
    this.datosFiltrados = [...this.relaciones];
  }
}
