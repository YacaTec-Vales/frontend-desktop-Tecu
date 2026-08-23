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
    // Usamos el endpoint de distribuidores como sugirió el usuario,
    // limitando a 100 para evitar el error BAD_REQUEST (limit > 100).
    this.distribuidorService.getDistribuidores(1, 100).subscribe({
      next: (res) => {
        const dists = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        dists.forEach((d: any) => {
          let name = 'Desconocido';
          
          if (d?.user?.username) {
            name = d.user.username;
          } else if (d?.user?.name) {
            name = `${d.user.name} ${d.user.lastName || ''}`.trim();
          } else if (d?.generalData?.nombre) {
            name = `${d.generalData.nombre} ${d.generalData.apellido_paterno || ''}`.trim();
          } else if (d?.nombre) {
            name = d.nombre;
          }
          
          this.distributorNames[d.id] = name || 'Desconocido';
        });
        
        // Si hay IDs en la tabla que no vinieron en la página 1, los marcamos como Desconocidos
        // para que no se queden en undefined
        this.relaciones.forEach(r => {
          if (!this.distributorNames[r.distributorId]) {
            this.distributorNames[r.distributorId] = 'Desconocido';
          }
        });
        
        this.cdr.detectChanges();
      },
      error: () => {
        console.error('Error al obtener lista de distribuidores para mapear nombres');
        this.relaciones.forEach(r => {
          this.distributorNames[r.distributorId] = 'Error';
        });
        this.cdr.detectChanges();
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
