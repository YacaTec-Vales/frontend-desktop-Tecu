import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { InputComponent } from '../../../components/ui/input/input';
import { TableActionsComponent } from '../../../components/ui/table/table-actions';
import { VpnOnlyDirective } from '../../../core/directives/vpn-only.directive';

import { StaffService } from '../../../core/services/staff.service';
import { Coordinador, Verificador, Cajero, CreateStaffDto } from '../../../core/models/staff.model';

type PersonalTab = 'coordinadores' | 'verificadores' | 'cajeros';

@Component({
  selector: 'app-plantilla',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, InputComponent, TableActionsComponent, VpnOnlyDirective],
  templateUrl: './plantilla.component.html'
})
export class PlantillaComponent implements OnInit {
  activePersonalTab: PersonalTab = 'coordinadores';

  // State Modales
  isPersonalModalOpen = false;
  isSaving = false;
  errorMessage = '';
  isEditingMode = false;
  entityToEdit: any = null;

  // API Data
  coordinadores: Coordinador[] = [];
  verificadores: Verificador[] = [];
  cajeros: Cajero[] = [];

  isCoordinadoresLoaded = false;
  isCoordinadoresLoading = false;
  isVerificadoresLoaded = false;
  isVerificadoresLoading = false;
  isCajerosLoaded = false;
  isCajerosLoading = false;

  // Pagination & Search States
  coordinadoresPage = 1;
  coordinadoresTotal = 0;
  coordinadoresSearch = '';
  coordinadoresLimit = 10;

  verificadoresPage = 1;
  verificadoresTotal = 0;
  verificadoresSearch = '';
  verificadoresLimit = 10;

  cajerosPage = 1;
  cajerosTotal = 0;
  cajerosSearch = '';
  cajerosLimit = 10;

  personalForm: FormGroup;

  constructor(
    private staffService: StaffService, 
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.personalForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      lastNamePaternal: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      lastNameMaternal: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      branchId: ['']
    });
  }

  ngOnInit() {
    this.loadActiveTab();
  }

  loadActiveTab(forceRefresh: boolean = false) {
    if (this.activePersonalTab === 'coordinadores') {
      if (this.isCoordinadoresLoaded && !forceRefresh) return;
      this.isCoordinadoresLoading = true;
      this.staffService.getCoordinadores(this.coordinadoresPage, this.coordinadoresLimit, this.coordinadoresSearch).subscribe({
        next: (res) => {
          this.coordinadores = res.data;
          this.coordinadoresTotal = res.meta.itemCount;
          this.isCoordinadoresLoaded = true;
          this.isCoordinadoresLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error cargando coordinadores', err);
          this.coordinadores = [];
          this.isCoordinadoresLoaded = true;
          this.isCoordinadoresLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else if (this.activePersonalTab === 'verificadores') {
      if (this.isVerificadoresLoaded && !forceRefresh) return;
      this.isVerificadoresLoading = true;
      this.staffService.getVerificadores(this.verificadoresPage, this.verificadoresLimit, this.verificadoresSearch).subscribe({
        next: (res) => {
          this.verificadores = res.data;
          this.verificadoresTotal = res.meta.itemCount;
          this.isVerificadoresLoaded = true;
          this.isVerificadoresLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error cargando verificadores', err);
          this.verificadores = [];
          this.isVerificadoresLoaded = true;
          this.isVerificadoresLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else if (this.activePersonalTab === 'cajeros') {
      if (this.isCajerosLoaded && !forceRefresh) return;
      this.isCajerosLoading = true;
      this.staffService.getCajeros(this.cajerosPage, this.cajerosLimit, this.cajerosSearch).subscribe({
        next: (res) => {
          this.cajeros = res.data;
          this.cajerosTotal = res.meta.itemCount;
          this.isCajerosLoaded = true;
          this.isCajerosLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error cargando cajeros', err);
          this.cajeros = [];
          this.isCajerosLoaded = true;
          this.isCajerosLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  setPersonalTab(tab: PersonalTab) {
    if (this.activePersonalTab !== tab) {
      this.activePersonalTab = tab;
      this.loadActiveTab();
    }
  }

  onPageChange(page: number, type: string) {
    if (type === 'coordinadores') { this.coordinadoresPage = page; }
    else if (type === 'verificadores') { this.verificadoresPage = page; }
    else if (type === 'cajeros') { this.cajerosPage = page; }
    this.loadActiveTab(true);
  }

  onSearch(term: string, type: string) {
    if (type === 'coordinadores') { this.coordinadoresSearch = term; this.coordinadoresPage = 1; }
    else if (type === 'verificadores') { this.verificadoresSearch = term; this.verificadoresPage = 1; }
    else if (type === 'cajeros') { this.cajerosSearch = term; this.cajerosPage = 1; }
    this.loadActiveTab(true);
  }

  onLimitChange(limit: number, type: string) {
    if (type === 'coordinadores') { this.coordinadoresLimit = limit; this.coordinadoresPage = 1; }
    else if (type === 'verificadores') { this.verificadoresLimit = limit; this.verificadoresPage = 1; }
    else if (type === 'cajeros') { this.cajerosLimit = limit; this.cajerosPage = 1; }
    this.loadActiveTab(true);
  }

  abrirModalPersonal() { 
    this.isEditingMode = false;
    this.entityToEdit = null;
    this.isPersonalModalOpen = true; 
    this.errorMessage = '';
    this.personalForm.reset({ branchId: '' });
  }

  cerrarModalPersonal() { 
    if (this.isSaving) return;
    this.isPersonalModalOpen = false; 
    this.isEditingMode = false;
    this.entityToEdit = null;
    this.errorMessage = '';
    this.personalForm.reset({ branchId: '' }); 
  }

  guardarPersonal() {
    if (this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      this.errorMessage = 'Por favor, complete todos los campos obligatorios correctamente.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const payload = { ...this.personalForm.value };
    if (!payload.branchId || payload.branchId === '') {
      delete payload.branchId;
    }

    let saveAction: any;
    if (this.isEditingMode && this.entityToEdit) {
      const id = this.entityToEdit.id;
      if (this.activePersonalTab === 'coordinadores') saveAction = this.staffService.updateCoordinador(id, payload);
      else if (this.activePersonalTab === 'verificadores') saveAction = this.staffService.updateVerificador(id, payload);
      else saveAction = this.staffService.updateCajero(id, payload);
    } else {
      if (this.activePersonalTab === 'coordinadores') saveAction = this.staffService.createCoordinador(payload);
      else if (this.activePersonalTab === 'verificadores') saveAction = this.staffService.createVerificador(payload);
      else saveAction = this.staffService.createCajero(payload);
    }

    saveAction.subscribe({
      next: () => {
        this.isSaving = false;
        this.loadActiveTab(true);
        this.cerrarModalPersonal();
      },
      error: (err: any) => {
        this.isSaving = false;
        this.errorMessage = err.error?.message || 'Ocurrió un error al registrar al personal. Verifique si el correo ya existe.';
      }
    });
  }

  handleTableAction(event: {action: string, id: string}, type: string) {
    if (event.action === 'edit') {
      let p: any;
      if (type === 'coordinadores') p = this.coordinadores.find(x => x.id === event.id);
      else if (type === 'verificadores') p = this.verificadores.find(x => x.id === event.id);
      else if (type === 'cajeros') p = this.cajeros.find(x => x.id === event.id);

      if (p) {
        this.isEditingMode = true;
        this.entityToEdit = p;
        this.personalForm.patchValue({
          firstName: p.firstName,
          lastNamePaternal: p.lastNamePaternal,
          lastNameMaternal: p.lastNameMaternal,
          email: p.email,
          phone: p.phone || '',
          branchId: p.branchId || ''
        });
        this.isPersonalModalOpen = true;
        this.errorMessage = '';
      }
    } else if (event.action === 'delete') {
      alert(`Función para dar de baja ${type} en desarrollo.`);
    }
  }
}
