import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DistribuidorService } from '../../../core/services/distribuidor.service';
import { BranchService } from '../../../core/services/branch.service';
import { CategoryService, CreditCategory } from '../../../core/services/category.service';
import { StaffService } from '../../../core/services/staff.service';
import { Branch } from '../../../core/models/branch.model';
import { Coordinador } from '../../../core/models/staff.model';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { ButtonComponent } from '../../../components/ui/button/button';

@Component({
  selector: 'app-distribuidoras',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ModalComponent, ButtonComponent],
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
    private staffService: StaffService
  ) {}

  ngOnInit() {
    this.loadDistribuidores();
    this.loadCatalogs();
  }

  loadDistribuidores() {
    this.distribuidorService.getDistribuidores(this.page, this.limit, this.search).subscribe(res => {
      this.distribuidoras = res.data;
      this.total = res.meta?.itemCount || 0;
    });
  }

  loadCatalogs() {
    this.branchService.getBranches(1, 100).subscribe(res => this.branches = res.data);
    this.categoryService.getCategories(1, 100).subscribe(res => this.categories = res.data);
    this.staffService.getStaffByRole('COORDINADOR', 1, 100).subscribe(res => this.coordinators = res.data);
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
