import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { InputComponent } from '../../../components/ui/input/input';
import { BadgeComponent } from '../../../components/ui/badge/badge';

import { BranchService } from '../../../core/services/branch.service';
import { StaffService } from '../../../core/services/staff.service';
import { Branch } from '../../../core/models/branch.model';
import { Coordinador, Verificador, Cajero, CreateStaffDto } from '../../../core/models/staff.model';

type Tab = 'productos' | 'categorias' | 'sucursales' | 'personal';
type PersonalTab = 'coordinadores' | 'verificadores' | 'cajeros';

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, InputComponent, BadgeComponent],
  templateUrl: './catalogos.component.html'
})
export class CatalogosComponent implements OnInit {
  activeTab: Tab = 'productos';
  activePersonalTab: PersonalTab = 'coordinadores';

  // State Modales
  isProductoModalOpen = false;
  isCategoriaModalOpen = false;
  isSucursalModalOpen = false;
  isPersonalModalOpen = false;

  // -- Datos Dummy (Productos/Categorías) --
  productos = [
    { id: 'VAL-1', monto: 5000, estado: 'Activo' },
    { id: 'VAL-2', monto: 10000, estado: 'Activo' },
  ];
  
  categorias = [
    { nombre: 'Plata', ganancia: 6 },
    { nombre: 'Oro', ganancia: 10 },
  ];

  // API Data
  sucursales: Branch[] = [];
  coordinadores: Coordinador[] = [];
  verificadores: Verificador[] = [];
  cajeros: Cajero[] = [];

  // Forms Models
  nuevoProducto = { monto: null };
  nuevaCategoria = { nombre: '', ganancia: null };
  
  nuevaSucursal = { name: '', address: '', phone: '' };
  
  nuevoPersonal: CreateStaffDto = {
    firstName: '',
    lastNamePaternal: '',
    lastNameMaternal: '',
    email: '',
    phone: '',
    branchId: ''
  };

  constructor(
    private branchService: BranchService,
    private staffService: StaffService
  ) {}

  ngOnInit() {
    this.loadBranches();
    this.loadStaff();
  }

  loadBranches() {
    this.branchService.getBranches().subscribe(data => this.sucursales = data);
  }

  loadStaff() {
    this.staffService.getCoordinadores().subscribe(data => this.coordinadores = data);
    this.staffService.getVerificadores().subscribe(data => this.verificadores = data);
    this.staffService.getCajeros().subscribe(data => this.cajeros = data);
  }

  setTab(tab: Tab) {
    this.activeTab = tab;
  }

  setPersonalTab(tab: PersonalTab) {
    this.activePersonalTab = tab;
  }

  // Productos
  abrirModalProducto() { this.isProductoModalOpen = true; }
  cerrarModalProducto() { this.isProductoModalOpen = false; this.nuevoProducto = { monto: null }; }
  guardarProducto() {
    if (this.nuevoProducto.monto) {
      this.productos.push({ id: `VAL-${this.productos.length + 1}`, monto: this.nuevoProducto.monto, estado: 'Activo' });
      this.cerrarModalProducto();
    }
  }

  // Categorias
  abrirModalCategoria() { this.isCategoriaModalOpen = true; }
  cerrarModalCategoria() { this.isCategoriaModalOpen = false; this.nuevaCategoria = { nombre: '', ganancia: null }; }
  guardarCategoria() {
    if (this.nuevaCategoria.nombre && this.nuevaCategoria.ganancia) {
      this.categorias.push({ ...this.nuevaCategoria } as any);
      this.cerrarModalCategoria();
    }
  }

  // Sucursales
  abrirModalSucursal() { this.isSucursalModalOpen = true; }
  cerrarModalSucursal() { this.isSucursalModalOpen = false; this.nuevaSucursal = { name: '', address: '', phone: '' }; }
  guardarSucursal() {
    if (this.nuevaSucursal.name) {
      this.branchService.createBranch(this.nuevaSucursal).subscribe(() => {
        this.loadBranches();
        this.cerrarModalSucursal();
      });
    }
  }

  // Personal
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
