import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { ButtonComponent } from '../../../components/ui/button/button';
import { InputComponent } from '../../../components/ui/input/input';
import { SelectComponent } from '../../../components/ui/select/select';
import { CutService, CutResult } from '../../../core/services/cut.service';
import { BranchService } from '../../../core/services/branch.service';
import { Branch } from '../../../core/models/branch.model';

@Component({
  selector: 'app-panel-corporativo',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, ButtonComponent, InputComponent, SelectComponent],
  templateUrl: './panel-corporativo.component.html'
})
export class PanelCorporativoComponent implements OnInit {
  sucursales: Branch[] = [];
  branchOptions: { value: string, label: string }[] = [];
  
  selectedBranchId: string = '';
  cutDate: string = '';
  
  isLoadingBranches = false;
  isExecuting = false;
  
  errorMessage = '';
  successMessage = '';
  cutResult: CutResult | null = null;

  constructor(
    private branchService: BranchService,
    private cutService: CutService
  ) {}

  ngOnInit() {
    this.cargarSucursales();
    // Default to today
    this.cutDate = new Date().toISOString().split('T')[0];
  }

  cargarSucursales() {
    this.isLoadingBranches = true;
    this.branchService.getBranches().subscribe({
      next: (res) => {
        this.sucursales = res.data;
        this.branchOptions = res.data.map(b => ({ value: b.id, label: b.name }));
        if (this.branchOptions.length > 0) {
          this.selectedBranchId = this.branchOptions[0].value;
        }
        this.isLoadingBranches = false;
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar sucursales: ' + (err.error?.message || err.message);
        this.isLoadingBranches = false;
      }
    });
  }

  ejecutarCorte() {
    if (!this.selectedBranchId || !this.cutDate) {
      this.errorMessage = 'Selecciona una sucursal y una fecha válida.';
      return;
    }

    this.isExecuting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cutResult = null;

    this.cutService.runCut({ branchId: this.selectedBranchId, cutDate: this.cutDate }).subscribe({
      next: (res) => {
        this.isExecuting = false;
        this.successMessage = res.message;
        this.cutResult = res.data;
      },
      error: (err) => {
        this.isExecuting = false;
        this.errorMessage = 'Error al ejecutar el corte: ' + (err.error?.message || err.message);
      }
    });
  }
}
