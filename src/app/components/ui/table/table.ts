import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button';
import { ModalComponent } from '../modal/modal';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, ModalComponent],
  templateUrl: './table.html',
  styles: [`
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
  @Output() limitChange = new EventEmitter<number>();

  @ViewChild('tableEl') tableEl!: ElementRef<HTMLTableElement>;

  // Estados Internos UI
  isSearchVisible = false;
  isExportModalOpen = false;
  @Input() isLoading = false;
  private searchSubject = new Subject<string>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    // Configurar debounce para la búsqueda
    this.searchSubject.pipe(
      debounceTime(400)
    ).subscribe(value => {
      this.searchChange.emit(value);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // Ya no es necesario re-inicializar nada de simple-datatables
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }

  // ==== FUNCIONES INTERNAS (UI DE TABLA) ====

  onSearchInput(event: any) {
    const value = event.target.value;
    this.searchSubject.next(value);
  }

  onLimitChange(event: any) {
    const newLimit = parseInt(event.target.value, 10);
    this.limitChange.emit(newLimit);
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
    if (format === 'csv') {
      // Implementación simple de exportación a CSV ya que quitamos simple-datatables
      this.downloadCSV();
    } else {
      window.print();
    }
    this.isExportModalOpen = false;
  }

  private downloadCSV() {
    const table = this.tableEl.nativeElement;
    let csv = '';
    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      const cols = row.querySelectorAll('td, th');
      const rowData = [];
      for (let j = 0; j < cols.length; j++) {
        // Skip last column if it's actions
        if (j === cols.length - 1 && this.columns[j] === 'Acciones') continue;
        rowData.push('"' + (cols[j] as HTMLElement).innerText.replace(/"/g, '""') + '"');
      }
      csv += rowData.join(',') + '\\n';
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'tabla.csv';
    link.click();
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
