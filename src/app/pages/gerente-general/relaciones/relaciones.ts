import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RelationService, RelationDetails } from '../../../core/services/relation.service';
import { BranchService } from '../../../core/services/branch.service';
import { Branch } from '../../../core/models/branch.model';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { DistribuidorService } from '../../../core/services/distribuidor.service';

@Component({
  selector: 'app-relaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent],
  templateUrl: './relaciones.html',
})
export class Relaciones implements OnInit {
  relaciones: RelationDetails[] = [];
  branches: Branch[] = [];
  isLoading = false;
  
  page = 1;
  limit = 20;
  total = 0;
  
  selectedBranchId = '';
  
  distributorNames: { [id: string]: string } = {};

  isModalOpen = false;
  selectedRelation: RelationDetails | null = null;

  constructor(
    private relationService: RelationService,
    private branchService: BranchService,
    private distribuidorService: DistribuidorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadBranches();
    this.loadRelaciones();
  }

  loadBranches() {
    this.branchService.getBranches(1, 100).subscribe(res => {
      this.branches = res.data;
    });
  }

  loadRelaciones() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.relationService.getAllRelations(this.page, this.limit, this.selectedBranchId || undefined).subscribe({
      next: (res) => {
        this.relaciones = res.data;
        this.total = res.meta?.itemCount || 0;
        this.isLoading = false;
        this.fetchDistributorNames();
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPageChange(page: number) {
    this.page = page;
    this.loadRelaciones();
  }

  onLimitChange(limit: number) {
    this.limit = limit;
    this.page = 1;
    this.loadRelaciones();
  }

  onBranchFilterChange() {
    this.page = 1;
    this.loadRelaciones();
  }

  fetchDistributorNames() {
    const uniqueIds = Array.from(new Set(this.relaciones.map(r => r.distributorId)));
    uniqueIds.forEach(id => {
      if (!this.distributorNames[id]) {
        this.distributorNames[id] = 'Cargando...';
        this.distribuidorService.getDistribuidorById(id).subscribe({
          next: (dist) => {
            const d = dist as any;
            if (d && d.generalData) {
              this.distributorNames[id] = `${d.generalData.nombre} ${d.generalData.apellido_paterno}`;
            } else if (d && d.nombre) {
              this.distributorNames[id] = d.nombre;
            } else {
              this.distributorNames[id] = 'Desconocido';
            }
            this.cdr.detectChanges();
          },
          error: () => {
            this.distributorNames[id] = 'Error';
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  verDetalles(rel: RelationDetails) {
    this.selectedRelation = rel;
    this.isModalOpen = true;
  }

  cerrarModal() {
    this.isModalOpen = false;
    this.selectedRelation = null;
  }
}
