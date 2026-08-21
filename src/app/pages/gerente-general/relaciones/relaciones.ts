import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RelationService, RelationDetails } from '../../../core/services/relation.service';
import { BranchService } from '../../../core/services/branch.service';
import { Branch } from '../../../core/models/branch.model';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';

@Component({
  selector: 'app-relaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent],
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

  constructor(
    private relationService: RelationService,
    private branchService: BranchService
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
    this.relationService.getAllRelations(this.page, this.limit, this.selectedBranchId || undefined).subscribe({
      next: (res) => {
        this.relaciones = res.data;
        this.total = res.meta?.itemCount || 0;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  onBranchFilterChange() {
    this.page = 1;
    this.loadRelaciones();
  }
}
