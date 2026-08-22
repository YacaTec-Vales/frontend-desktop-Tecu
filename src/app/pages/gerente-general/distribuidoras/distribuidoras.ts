import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DistribuidorService } from '../../../core/services/distribuidor.service';
import { BranchService } from '../../../core/services/branch.service';
import { CategoryService, CreditCategory } from '../../../core/services/category.service';
import { StaffService } from '../../../core/services/staff.service';
import { Branch } from '../../../core/models/branch.model';
import { Coordinador } from '../../../core/models/staff.model';
import { CardComponent } from '../../../components/ui/card/card';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { ButtonComponent } from '../../../components/ui/button/button';
import { TableComponent } from '../../../components/ui/table/table';

@Component({
  selector: 'app-distribuidoras',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, ModalComponent, ButtonComponent, TableComponent],
  templateUrl: './distribuidoras.html',
})
export class Distribuidoras implements OnInit {
  distribuidoras: any[] = [];
  branches: Branch[] = [];
  categories: CreditCategory[] = [];
  coordinators: Coordinador[] = [];
  
  page = 1;
  limit = 10;
  total = 0;
  search = '';

  selectedDistribuidora: any = null;
  isLoading = false;
  
  // Modals state
  isBranchModalOpen = false;
  isCategoryModalOpen = false;
  isCoordinatorModalOpen = false;

  // Selected values
  selectedBranchId = '';
  selectedCategoryId = '';
  selectedCoordinatorId = '';

  constructor(
    private distribuidorService: DistribuidorService,
    private branchService: BranchService,
    private categoryService: CategoryService,
    private staffService: StaffService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDistribuidores();
    this.loadCatalogs();
  }

  loadDistribuidores() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.distribuidorService.getDistribuidores(this.page, this.limit, this.search).subscribe({
      next: (res) => {
        this.distribuidoras = res.data;
        this.total = res.meta?.itemCount || 0;
        this.isLoading = false;
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
    this.loadDistribuidores();
  }

  onLimitChange(limit: number) {
    this.limit = limit;
    this.page = 1;
    this.loadDistribuidores();
  }

  onSearch(term: string) {
    this.search = term;
    this.page = 1;
    this.loadDistribuidores();
  }

  loadCatalogs() {
    this.branchService.getBranches(1, 100).subscribe(res => this.branches = res.data);
    this.categoryService.getCategories(1, 100).subscribe(res => this.categories = res.data);
    this.staffService.getCoordinadores(1, 100).subscribe(res => this.coordinators = res.data);
  }

  openBranchModal(dist: any) {
    this.selectedDistribuidora = dist;
    this.selectedBranchId = dist.branch?.id || '';
    this.isBranchModalOpen = true;
  }

  openCategoryModal(dist: any) {
    this.selectedDistribuidora = dist;
    this.selectedCategoryId = dist.category?.id || '';
    this.isCategoryModalOpen = true;
  }

  openCoordinatorModal(dist: any) {
    this.selectedDistribuidora = dist;
    this.selectedCoordinatorId = dist.coordinator?.id || '';
    this.isCoordinatorModalOpen = true;
  }

  changeBranch() {
    if (!this.selectedBranchId) return;
    this.distribuidorService.changeBranch(this.selectedDistribuidora.id, this.selectedBranchId).subscribe(() => {
      this.isBranchModalOpen = false;
      this.loadDistribuidores();
    });
  }

  changeCategory() {
    if (!this.selectedCategoryId) return;
    this.distribuidorService.changeCategory(this.selectedDistribuidora.id, this.selectedCategoryId).subscribe(() => {
      this.isCategoryModalOpen = false;
      this.loadDistribuidores();
    });
  }

  changeCoordinator() {
    if (!this.selectedCoordinatorId) return;
    this.distribuidorService.changeCoordinator(this.selectedDistribuidora.id, this.selectedCoordinatorId).subscribe(() => {
      this.isCoordinatorModalOpen = false;
      this.loadDistribuidores();
    });
  }
}
