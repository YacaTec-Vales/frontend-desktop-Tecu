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
import { TableComponent } from '../../../components/ui/table/table';

@Component({
  selector: 'app-distribuidoras',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent],
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
  isLoading = false;
  openDropdownId: string | null = null;

  toggleDropdown(id: string) {
    if (this.openDropdownId === id) {
      this.openDropdownId = null;
    } else {
      this.openDropdownId = id;
    }
  }

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
        const actualData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const actualMeta = res.data?.meta || res.meta || {};
        
        this.distribuidoras = actualData;
        this.total = actualMeta.total || actualMeta.itemCount || 0;
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

  onSearch(term: string) {
    this.search = term;
    this.page = 1;
    this.loadDistribuidores();
  }

  onLimitChange(limit: number) {
    this.limit = limit;
    this.page = 1;
    this.loadDistribuidores();
  }

  loadCatalogs() {
    this.categoryService.getCategories(1, 100).subscribe(res => {
      this.categories = res.data;
      this.cdr.detectChanges();
    });
  }

  getCategoryName(id: string): string {
    if (!id) return 'Sin Asignar';
    const c = this.categories.find(cat => cat.id === id);
    return c ? c.name : 'Sin Asignar';
  }

  changeCategoryInline(dist: any, newCategoryId: string) {
    if (!newCategoryId) return;
    this.distribuidorService.changeCategory(dist.id, newCategoryId).subscribe({
      next: () => {
        this.loadDistribuidores();
      },
      error: (err) => {
        console.error('Error changing category', err);
        this.loadDistribuidores(); // revert on error
      }
    });
  }
}
