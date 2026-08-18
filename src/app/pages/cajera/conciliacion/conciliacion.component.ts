import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { ButtonComponent } from '../../../components/ui/button/button';
import { InputComponent } from '../../../components/ui/input/input';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { TableComponent } from '../../../components/ui/table/table';

import { ReconciliationService, BankMovement, ReconciliationBatch } from '../../../core/services/reconciliation.service';
import { RelationService, RelationDetails } from '../../../core/services/relation.service';

@Component({
  selector: 'app-conciliacion',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, ButtonComponent, InputComponent, BadgeComponent, ModalComponent, TableComponent],
  templateUrl: './conciliacion.component.html'
})
export class ConciliacionComponent implements OnInit {
  // Tabs
  activeTab: 'automatica' | 'manual' = 'automatica';

  // --- AUTOMATICA ---
  selectedFile: File | null = null;
  isUploading = false;
  uploadSuccessMessage = '';
  uploadErrorMessage = '';
  batches: ReconciliationBatch[] = [];
  batchesPage = 1;
  batchesTotal = 0;
  isBatchesLoaded = false;

  // --- MANUAL ---
  unmatchedMovements: BankMovement[] = [];
  unmatchedPage = 1;
  unmatchedTotal = 0;
  isUnmatchedLoaded = false;

  isManualModalOpen = false;
  selectedMovement: BankMovement | null = null;
  
  // Pending Relations for Modal
  pendingRelations: RelationDetails[] = [];
  pendingSearch = '';
  selectedRelationId = '';
  authorizationId = '';
  isProcessingManual = false;
  manualErrorMessage = '';

  constructor(
    private reconciliationService: ReconciliationService,
    private relationService: RelationService
  ) {}

  ngOnInit() {
    this.loadBatches();
  }

  setTab(tab: 'automatica' | 'manual') {
    this.activeTab = tab;
    if (tab === 'automatica' && !this.isBatchesLoaded) {
      this.loadBatches();
    } else if (tab === 'manual' && !this.isUnmatchedLoaded) {
      this.loadUnmatched();
    }
  }

  // --- AUTOMATICA ---
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadFile() {
    if (!this.selectedFile) return;
    this.isUploading = true;
    this.uploadSuccessMessage = '';
    this.uploadErrorMessage = '';

    this.reconciliationService.uploadExcel(this.selectedFile).subscribe({
      next: (res) => {
        this.isUploading = false;
        this.uploadSuccessMessage = res.message || 'Archivo procesado exitosamente.';
        this.selectedFile = null;
        this.loadBatches(); // Reload batches to show the new one
        // Reset file input in template (can be handled via viewchild if needed)
      },
      error: (err) => {
        this.isUploading = false;
        this.uploadErrorMessage = 'Error al subir archivo: ' + (err.error?.message || err.message);
      }
    });
  }

  loadBatches() {
    this.reconciliationService.getBatches(this.batchesPage, 10).subscribe(res => {
      this.batches = res.data;
      this.batchesTotal = res.meta.itemCount;
      this.isBatchesLoaded = true;
    });
  }

  onBatchesPageChange(page: number) {
    this.batchesPage = page;
    this.loadBatches();
  }

  // --- MANUAL ---
  loadUnmatched() {
    this.reconciliationService.getUnmatchedMovements(this.unmatchedPage, 10).subscribe(res => {
      this.unmatchedMovements = res.data;
      this.unmatchedTotal = res.meta.itemCount;
      this.isUnmatchedLoaded = true;
    });
  }

  onUnmatchedPageChange(page: number) {
    this.unmatchedPage = page;
    this.loadUnmatched();
  }

  handleTableAction(event: any) {
    if (event.action === 'edit') {
      const mov = this.unmatchedMovements.find(m => m.id === event.id);
      if (mov) {
        this.abrirModalManual(mov);
      }
    }
  }

  abrirModalManual(movement: BankMovement) {
    this.selectedMovement = movement;
    this.selectedRelationId = '';
    this.authorizationId = '';
    this.manualErrorMessage = '';
    this.pendingSearch = '';
    this.isManualModalOpen = true;
    this.loadPendingRelations();
  }

  cerrarModalManual() {
    this.isManualModalOpen = false;
    this.selectedMovement = null;
  }

  loadPendingRelations() {
    this.relationService.getPendingRelations(1, 50, this.pendingSearch).subscribe(res => {
      this.pendingRelations = res.data;
    });
  }

  onPendingSearchChange(term: string) {
    this.pendingSearch = term;
    this.loadPendingRelations();
  }

  confirmManualReconciliation() {
    if (!this.selectedMovement || !this.selectedRelationId) return;

    this.isProcessingManual = true;
    this.manualErrorMessage = '';

    this.reconciliationService.manualReconciliation(this.selectedMovement.id, this.selectedRelationId, this.authorizationId).subscribe({
      next: () => {
        this.isProcessingManual = false;
        this.cerrarModalManual();
        this.loadUnmatched(); // Refresh list
      },
      error: (err) => {
        this.isProcessingManual = false;
        this.manualErrorMessage = err.error?.message || err.message || 'Error al procesar la conciliación manual.';
      }
    });
  }
}

