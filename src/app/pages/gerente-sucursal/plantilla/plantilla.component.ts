import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { InputComponent } from '../../../components/ui/input/input';
import { TableActionsComponent } from '../../../components/ui/table/table-actions';

import { StaffService } from '../../../core/services/staff.service';
import { Coordinador, Verificador, Cajero, CreateStaffDto } from '../../../core/models/staff.model';

type PersonalTab = 'coordinadores' | 'verificadores' | 'cajeros';

@Component({
  selector: 'app-plantilla',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, InputComponent, TableActionsComponent],
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
  isVerificadoresLoaded = false;
  isCajerosLoaded = false;

  // Forms Models
  nuevoPersonal: CreateStaffDto = {
    firstName: '',
    lastNamePaternal: '',
    lastNameMaternal: '',
    email: '',
    phone: '',
    branchId: '' // GS no requiere enviarlo explícitamente, backend asume la sucursal del token
  };

  showPersonalTable = true;
  private personalTableTimeout: any;

  constructor(private staffService: StaffService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadStaff();
  }

  loadStaff() {
    this.isCoordinadoresLoaded = false;
    this.isVerificadoresLoaded = false;
    this.isCajerosLoaded = false;
    
    console.log('Iniciando loadStaff()...');

    this.staffService.getCoordinadores().subscribe({
      next: (data) => {
        console.log('getCoordinadores SUCCESS:', data);
        this.coordinadores = data;
        this.isCoordinadoresLoaded = true;
        this.cdr.detectChanges();
        this.refreshPersonalTable();
      },
      error: (err) => {
        console.error('Error cargando coordinadores', err);
        this.coordinadores = [];
        this.isCoordinadoresLoaded = true;
        this.cdr.detectChanges();
      }
    });

    this.staffService.getVerificadores().subscribe({
      next: (data) => {
        console.log('getVerificadores SUCCESS:', data);
        this.verificadores = data;
        this.isVerificadoresLoaded = true;
        this.cdr.detectChanges();
        this.refreshPersonalTable();
      },
      error: (err) => {
        console.error('Error cargando verificadores', err);
        this.verificadores = [];
        this.isVerificadoresLoaded = true;
        this.cdr.detectChanges();
      }
    });

    this.staffService.getCajeros().subscribe({
      next: (data) => {
        this.cajeros = data;
        this.isCajerosLoaded = true;
        this.cdr.detectChanges();
        this.refreshPersonalTable();
      },
      error: (err) => {
        console.error('Error cargando cajeros', err);
        this.cajeros = [];
        this.isCajerosLoaded = true;
        this.cdr.detectChanges();
      }
    });
  }

  setPersonalTab(tab: PersonalTab) {
    if (this.activePersonalTab !== tab) {
      this.activePersonalTab = tab;
      this.refreshPersonalTable();
    }
  }

  refreshPersonalTable() {
    this.showPersonalTable = false;
    this.cdr.detectChanges();
    if (this.personalTableTimeout) clearTimeout(this.personalTableTimeout);
    this.personalTableTimeout = setTimeout(() => {
      this.showPersonalTable = true;
      this.cdr.detectChanges();
    }, 10);
  }

  abrirModalPersonal() { 
    this.isEditingMode = false;
    this.entityToEdit = null;
    this.isPersonalModalOpen = true; 
    this.errorMessage = '';
    this.nuevoPersonal = { firstName: '', lastNamePaternal: '', lastNameMaternal: '', email: '', phone: '', branchId: '' };
  }

  cerrarModalPersonal() { 
    if (this.isSaving) return;
    this.isPersonalModalOpen = false; 
    this.isEditingMode = false;
    this.entityToEdit = null;
    this.errorMessage = '';
    this.nuevoPersonal = { firstName: '', lastNamePaternal: '', lastNameMaternal: '', email: '', phone: '', branchId: '' }; 
  }

  get isFormValid(): boolean {
    return !!(
      this.nuevoPersonal.firstName &&
      this.nuevoPersonal.lastNamePaternal &&
      this.nuevoPersonal.lastNameMaternal &&
      this.nuevoPersonal.email &&
      this.nuevoPersonal.email.includes('@') &&
      this.nuevoPersonal.phone &&
      this.nuevoPersonal.phone.length >= 10
    );
  }

  guardarPersonal() {
    if (!this.isFormValid) {
      this.errorMessage = 'Por favor, complete todos los campos obligatorios correctamente.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const payload: any = { ...this.nuevoPersonal };
    if (!payload.branchId || payload.branchId === '') {
      delete payload.branchId;
    }
    delete payload.username; // Asegurarse de que nunca se envíe

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
        this.loadStaff();
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
        this.nuevoPersonal = {
          firstName: p.firstName,
          lastNamePaternal: p.lastNamePaternal,
          lastNameMaternal: p.lastNameMaternal,
          email: p.email,
          phone: p.phone || '',
          branchId: p.branchId || ''
        };
        this.isPersonalModalOpen = true;
        this.errorMessage = '';
      }
    } else if (event.action === 'delete') {
      alert(`Función para dar de baja ${type} en desarrollo.`);
    }
  }
}
