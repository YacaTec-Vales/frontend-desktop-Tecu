import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTable, exportCSV } from 'simple-datatables';
import { ButtonComponent } from '../button/button';
import { ModalComponent } from '../modal/modal';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ModalComponent],
  templateUrl: './table.html',
  styles: [`
    /* Ocultar la barra superior nativa completa (ya que movimos el selector) */
    :host ::ng-deep .datatable-top {
      display: none !important;
    }
    :host ::ng-deep .datatable-wrapper {
      width: 100%;
    }
    
    /* Espaciado del Bottom (Selector de Rows, Info y Paginador) */
    :host ::ng-deep .datatable-bottom {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      font-size: 0.875rem;
      color: #6b7280;
    }
    
    /* Agrupar dropdown y texto info a la izquierda */
    :host ::ng-deep .datatable-info {
      margin-right: auto;
      margin-left: 1rem;
    }
    
    /* Estilizar el Selector de Rows */
    :host ::ng-deep .datatable-selector {
      background-color: #f9fafb;
      border: 1px solid #d1d5db;
      color: #111827;
      border-radius: 0.5rem;
      padding: 0.375rem 2rem 0.375rem 0.75rem;
      font-size: 0.875rem;
      outline: none;
    }
    :host ::ng-deep .dark .datatable-selector {
      background-color: #374151;
      border-color: #4b5563;
      color: white;
    }
    
    /* Estilizar Paginación */
    :host ::ng-deep .datatable-pagination ul {
      display: inline-flex;
      align-items: center;
      margin: 0;
      padding: 0;
      list-style: none;
      border-radius: 0.5rem;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    :host ::ng-deep .datatable-pagination li {
      margin: 0;
    }
    :host ::ng-deep .datatable-pagination a {
      padding: 0.5rem 0.75rem;
      border: 1px solid #e5e7eb;
      background-color: white;
      color: #6b7280;
      text-decoration: none;
      cursor: pointer;
    }
    :host ::ng-deep .datatable-pagination a:hover {
      background-color: #f3f4f6;
      color: #111827;
    }
    :host ::ng-deep .datatable-pagination .active a {
      background-color: #f3f4f6;
      color: #111827;
      font-weight: 600;
    }
    :host ::ng-deep .dark .datatable-pagination a {
      background-color: #1f2937;
      border-color: #374151;
      color: #9ca3af;
    }
    :host ::ng-deep .dark .datatable-pagination a:hover,
    :host ::ng-deep .dark .datatable-pagination .active a {
      background-color: #374151;
      color: white;
    }
    /* Filtros de columna */
    :host ::ng-deep .column-filter-row {
      display: none;
    }
    :host ::ng-deep .show-column-filters .column-filter-row {
      display: table-row;
    }
    :host ::ng-deep .column-filter {
      margin-top: 0.5rem;
      width: 100%;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      border-radius: 0.25rem;
      border: 1px solid #d1d5db;
    }
  `]
})
export class TableComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() columns: string[] = [];
  @Input() isEmpty: boolean = false;
  @Input() emptyMessage: string = 'No hay datos disponibles.';

  @Input() dataTrigger: any;

  // ==== SERVER SIDE PAGINATION ====
  @Input() useServerPagination = false;
  @Input() currentPage = 1;
  @Input() totalItems = 0;
  @Input() limit = 100;
  
  @Output() onAction = new EventEmitter<{ action: string, id: string }>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() searchChange = new EventEmitter<string>();

  @ViewChild('tableEl') tableEl!: ElementRef<HTMLTableElement>;

  // Estados Internos UI
  isSearchVisible = false;
  isExportModalOpen = false;

  private dtInstance: any;

  ngAfterViewInit() {
    if (!this.isEmpty && this.tableEl) {
      this.reinit();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['dataTrigger']) {
      this.reinit();
    }
  }

  ngOnDestroy() {
    if (this.dtInstance) {
      this.restoreDropdown();
      this.dtInstance.destroy();
    }
  }

  reinit() {
    if (this.dtInstance) {
      this.restoreDropdown();
      this.dtInstance.destroy();
      this.dtInstance = null;
    }

    // Esperar a que Angular renderice las filas (<tr>) en el DOM después del ciclo de detección de cambios
    setTimeout(() => {
      this.waitForRowsAndInit();
    }, 0);
  }

  private restoreDropdown() {
    if (!this.tableEl || !this.tableEl.nativeElement) return;
    const wrapper = this.tableEl.nativeElement.closest('.datatable-wrapper');
    if (wrapper) {
      const top = wrapper.querySelector('.datatable-top');
      const dropdown = wrapper.querySelector('.datatable-dropdown');
      if (top && dropdown) {
        top.appendChild(dropdown);
      }
    }
  }

  private waitForRowsAndInit() {
    if (!this.tableEl || !this.tableEl.nativeElement) return;

    const tbody = this.tableEl.nativeElement.querySelector('tbody');
    if (!tbody) {
      setTimeout(() => this.waitForRowsAndInit(), 50);
      return;
    }

    // Si no hay datos esperados, inicializar vacío
    if (this.isEmpty || (this.dataTrigger && this.dataTrigger.length === 0)) {
      this.initTable();
      return;
    }

    const checkRows = () => {
      const rows = tbody.querySelectorAll('tr');
      const expectedCount = this.dataTrigger ? this.dataTrigger.length : 1;

      if (this.dataTrigger ? rows.length === expectedCount : rows.length > 0) {
        this.initTable();
      } else {
        setTimeout(checkRows, 50); // Polling hasta que Angular termine el *ngFor
      }
    };

    checkRows();
  }

  private initTable() {
    if (!this.tableEl || !this.tableEl.nativeElement || this.dtInstance) return;

    this.dtInstance = new DataTable(this.tableEl.nativeElement, {
      searchable: !this.useServerPagination, // Si es server, quitamos el buscador interno
      sortable: true,
      paging: !this.useServerPagination, // Desactivar paginador nativo si usamos el nuestro
      perPage: this.useServerPagination ? this.limit : 10,
      perPageSelect: [5, 10, 25, 50, 100],
      labels: {
        placeholder: "Buscar...",
        searchTitle: "Buscar dentro de la tabla",
        pageTitle: "Página {page}",
        perPage: "registros por página",
        noRows: "No hay registros",
        info: "Mostrando {start} a {end} de {rows} registros",
        noResults: "No hay resultados para la búsqueda"
      }
    });

    // Implementar filtros por columna y mover dropdown
    this.dtInstance.on('datatable.init', () => {
      const wrapper = this.tableEl.nativeElement.closest('.datatable-wrapper');
      if (wrapper) {
        // Mover el selector de cantidad de filas al pie de la tabla
        const bottom = wrapper.querySelector('.datatable-bottom');
        const dropdown = wrapper.querySelector('.datatable-dropdown');
        if (bottom && dropdown) {
          bottom.insertBefore(dropdown, bottom.firstChild);
        }
      }

      const thead = this.tableEl.nativeElement.querySelector('thead');
      if (thead) {
        const tr = document.createElement('tr');
        tr.className = 'column-filter-row';
        this.columns.forEach((col, index) => {
          const th = document.createElement('th');
          th.className = 'px-6 py-2';
          if (col.toLowerCase() !== 'acciones') {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `Filtrar...`;
            input.className = 'column-filter bg-gray-50 text-gray-900 border-gray-300 focus:ring-brand focus:border-brand';
            input.addEventListener('keyup', (e: any) => {
              // Buscar en la columna específica usando API simple-datatables
              this.dtInstance.search(e.target.value, [index]);
            });
            th.appendChild(input);
          }
          tr.appendChild(th);
        });
        thead.appendChild(tr);
      }
    });
  }

  // ==== FUNCIONES INTERNAS (UI DE TABLA) ====

  onSearchInput(event: any) {
    if (this.useServerPagination) {
      this.searchChange.emit(event.target.value);
    } else if (this.dtInstance) {
      this.dtInstance.search(event.target.value);
    }
  }

  // Métodos del Paginador Custom
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.limit);
  }

  get canGoPrevious(): boolean {
    return this.currentPage > 1;
  }

  get canGoNext(): boolean {
    return this.currentPage < this.totalPages;
  }

  previousPage() {
    if (this.canGoPrevious) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  nextPage() {
    if (this.canGoNext) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
  
  get visiblePages(): number[] {
    const total = this.totalPages;
    if (total <= 5) {
      return Array.from({length: total}, (_, i) => i + 1);
    }
    const current = this.currentPage;
    if (current <= 3) return [1, 2, 3, 4, 5];
    if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
    return [current - 2, current - 1, current, current + 1, current + 2];
  }

  exportarDatos(format: 'csv' | 'pdf') {
    if (!this.dtInstance) return;
    if (format === 'csv') {
      exportCSV(this.dtInstance, { download: true, filename: 'tabla.csv' });
    } else {
      window.print();
    }
    this.isExportModalOpen = false;
  }

  // Delegación de clics en toda la tabla
  onTableClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const actionEl = target.closest('[data-action]');
    if (!actionEl) return;

    const action = actionEl.getAttribute('data-action');
    const id = actionEl.getAttribute('data-id');

    if (action && id) {
      // Emitir al padre
      this.onAction.emit({ action, id });
    }
  }
}
