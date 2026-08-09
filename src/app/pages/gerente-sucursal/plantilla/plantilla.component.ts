import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { InputComponent } from '../../../components/ui/input/input';

import { StaffService } from '../../../core/services/staff.service';
import { Coordinador, Verificador, Cajero, CreateStaffDto } from '../../../core/models/staff.model';

type PersonalTab = 'coordinadores' | 'verificadores' | 'cajeros';

@Component({
  selector: 'app-plantilla',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, InputComponent],
  templateUrl: './plantilla.component.html'
})
export class PlantillaComponent implements OnInit {
  activePersonalTab: PersonalTab = 'coordinadores';

  // State Modales
  isPersonalModalOpen = false;
  isSaving = false;
  errorMessage = '';

  // API Data
  coordinadores: Coordinador[] = [];
  verificadores: Verificador[] = [];
  cajeros: Cajero[] = [];

  // Forms Models
  nuevoPersonal: CreateStaffDto = {
    firstName: '',
    lastNamePaternal: '',
    lastNameMaternal: '',
    email: '',
    phone: '',
    branchId: '' // GS no requiere enviarlo explícitamente, backend asume la sucursal del token
  };

  constructor(private staffService: StaffService) {}

  ngOnInit() {
    this.loadStaff();
  }

  loadStaff() {
    this.staffService.getCoordinadores().subscribe(data => this.coordinadores = data);
    this.staffService.getVerificadores().subscribe(data => this.verificadores = data);
    this.staffService.getCajeros().subscribe(data => this.cajeros = data);
  }

  setPersonalTab(tab: PersonalTab) {
    this.activePersonalTab = tab;
  }

  abrirModalPersonal() { 
    this.isPersonalModalOpen = true; 
    this.errorMessage = '';
  }

  cerrarModalPersonal() { 
    if (this.isSaving) return;
    this.isPersonalModalOpen = false; 
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

    const saveAction = this.activePersonalTab === 'coordinadores' 
      ? this.staffService.createCoordinador(this.nuevoPersonal)
      : this.activePersonalTab === 'verificadores' 
      ? this.staffService.createVerificador(this.nuevoPersonal)
      : this.staffService.createCajero(this.nuevoPersonal);

    saveAction.subscribe({
      next: () => {
        this.isSaving = false;
        this.loadStaff();
        this.cerrarModalPersonal();
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = err.error?.message || 'Ocurrió un error al registrar al personal. Verifique si el correo ya existe.';
      }
    });
  }
}
