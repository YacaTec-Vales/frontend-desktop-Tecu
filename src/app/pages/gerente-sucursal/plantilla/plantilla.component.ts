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
    branchId: '' // En el backend el GS auto-asigna a su sucursal o se asume el token
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

  abrirModalPersonal() { this.isPersonalModalOpen = true; }
  cerrarModalPersonal() { 
    this.isPersonalModalOpen = false; 
    this.nuevoPersonal = { firstName: '', lastNamePaternal: '', lastNameMaternal: '', email: '', phone: '', branchId: '' }; 
  }

  guardarPersonal() {
    if (this.nuevoPersonal.firstName && this.nuevoPersonal.email) {
      const saveAction = this.activePersonalTab === 'coordinadores' 
        ? this.staffService.createCoordinador(this.nuevoPersonal)
        : this.activePersonalTab === 'verificadores' 
        ? this.staffService.createVerificador(this.nuevoPersonal)
        : this.staffService.createCajero(this.nuevoPersonal);

      saveAction.subscribe(() => {
        this.loadStaff();
        this.cerrarModalPersonal();
      });
    }
  }
}

