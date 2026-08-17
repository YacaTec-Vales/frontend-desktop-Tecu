import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { InputComponent } from '../../../components/ui/input/input';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { TableActionsComponent } from '../../../components/ui/table/table-actions';

import { BranchService } from '../../../core/services/branch.service';
import { StaffService } from '../../../core/services/staff.service';
import { ProductService, Product, CreateProductDto } from '../../../core/services/product.service';
import { Branch, CreateBranchDto, UpdateBranchDto } from '../../../core/models/branch.model';
import { Coordinador, Verificador, Cajero, CreateStaffDto } from '../../../core/models/staff.model';

type Tab = 'productos' | 'categorias' | 'sucursales' | 'personal';
type PersonalTab = 'gerentes' | 'coordinadores' | 'verificadores' | 'cajeros';

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, InputComponent, BadgeComponent, TableActionsComponent],
  templateUrl: './catalogos.component.html'
})
export class CatalogosComponent implements OnInit {
  activeTab: Tab = 'productos';
  activePersonalTab: PersonalTab = 'gerentes';

  // State Modales
  isProductoModalOpen = false;
  isEditProductoModalOpen = false;
  isDeactivateProductoModalOpen = false; // DEPRECATED - to be removed
  isCategoriaModalOpen = false;
  isSucursalModalOpen = false;
  isPersonalModalOpen = false;

  // Modales Unificados (Dinámicos)
  isEditingMode = false;
  isConfirmModalOpen = false;
  entityToDeactivate: { type: string, id: string } | null = null;

  // Load Flags
  isProductsLoaded = false;
  isBranchesLoaded = false;
  isStaffLoaded = false;
  
  // -- Datos Dummy (Categorías) --
  categorias = [
    { nombre: 'Plata', ganancia: 6 },
    { nombre: 'Oro', ganancia: 10 },
  ];

  // API Data
  productos: Product[] = [];
  sucursales: Branch[] = [];
  gerentes: any[] = [];
  coordinadores: Coordinador[] = [];
  verificadores: Verificador[] = [];
  cajeros: Cajero[] = [];

  // Forms Models
  nuevoProducto = { 
    code: '', 
    variant: 'NORMAL' as 'NORMAL' | 'PLUS',
    costPesos: null as number | null, 
    totalPeriods: null as number | null,
    commissionPorc: 0,
    insurancePesos: 0,
    interestPorc: 0
  };
  productoError: string | null = null;
  productoActivo: Product | null = null; // Para editar/desactivar
  nuevaCategoria = { nombre: '', ganancia: null };
  
  nuevaSucursal: CreateBranchDto = { name: '', branchType: 'SUCURSAL', esMatriz: false, address: '' };
  
  nuevoPersonal: CreateStaffDto = {
    firstName: '',
    lastNamePaternal: '',
    lastNameMaternal: '',
    email: '',
    phone: '',
    branchId: ''
  };

  sucursalError: string | null = null;
  personalError: string | null = null;

  constructor(
    private branchService: BranchService,
    private staffService: StaffService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadBranches();
    this.loadStaff();
    this.loadProducts();
  }

  loadProducts() {
    this.productService.getProducts().subscribe(data => {
      this.productos = data;
      this.isProductsLoaded = true;
      this.cdr.detectChanges();
    });
  }

  loadBranches() {
    this.branchService.getBranches().subscribe(data => {
      this.sucursales = data;
      this.isBranchesLoaded = true;
      this.cdr.detectChanges();
    });
  }

  loadStaff() {
    // Gerentes
    this.staffService.getGerentes().subscribe(data => {
      this.gerentes = data;
      this.checkStaffLoaded();
      this.cdr.detectChanges();
    });
    // Coordinadores
    this.staffService.getCoordinadores().subscribe(data => {
      this.coordinadores = data;
      this.checkStaffLoaded();
      this.cdr.detectChanges();
    });
    // Verificadores
    this.staffService.getVerificadores().subscribe(data => {
      this.verificadores = data;
      this.checkStaffLoaded();
      this.cdr.detectChanges();
    });
    // Cajeros
    this.staffService.getCajeros().subscribe(data => {
      this.cajeros = data;
      this.checkStaffLoaded();
      this.cdr.detectChanges();
    });
  }

  private checkStaffLoaded() {
    if (this.gerentes.length > 0 || this.coordinadores.length > 0 || this.verificadores.length > 0 || this.cajeros.length > 0) {
      this.isStaffLoaded = true;
    }
  }

  setTab(tab: Tab) {
    this.activeTab = tab;
  }

  setPersonalTab(tab: PersonalTab) {
    this.activePersonalTab = tab;
  }

  // Productos
  abrirModalProducto() { 
    this.isEditingMode = false;
    this.isProductoModalOpen = true; 
  }
  cerrarModalProducto() { 
    this.isProductoModalOpen = false; 
    this.isEditingMode = false;
    this.productoError = null;
    this.nuevoProducto = { code: '', variant: 'NORMAL', costPesos: null, totalPeriods: null, commissionPorc: 0, insurancePesos: 0, interestPorc: 0 };
  }
  
  get isProductoValid(): boolean {
    const p = this.nuevoProducto;
    if (!p.code || !/^\d{1,3}\/\d{1,3}$/.test(p.code)) return false;
    if (!p.costPesos || p.costPesos <= 0) return false;
    if (!p.totalPeriods || p.totalPeriods < 1 || p.totalPeriods > 60) return false;
    if (p.commissionPorc < 0 || p.insurancePesos < 0 || p.interestPorc < 0) return false;
    return true;
  }

  guardarProducto() {
    this.productoError = null;
    if (this.isProductoValid) {
      const dto: CreateProductDto = {
        code: this.nuevoProducto.code,
        variant: this.nuevoProducto.variant,
        costCents: Math.round(this.nuevoProducto.costPesos! * 100),
        totalPeriods: this.nuevoProducto.totalPeriods!,
        commissionBps: Math.round(this.nuevoProducto.commissionPorc * 100),
        insuranceCents: Math.round(this.nuevoProducto.insurancePesos * 100),
        interestPerPeriodBps: Math.round(this.nuevoProducto.interestPorc * 100)
      };
      
      this.productService.createProduct(dto).subscribe({
        next: () => {
          this.loadProducts();
          this.cerrarModalProducto();
        },
        error: (err) => {
          this.productoError = err.error?.message || 'Error al crear el producto. Revisa que el código no exista.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  // Edit / Deactivate Product (UI Only for now as API lacks endpoints)
  abrirEditProducto(prod: Product) {
    this.isEditingMode = true;
    this.nuevoProducto = {
      code: prod.code,
      variant: prod.variant as 'NORMAL' | 'PLUS',
      costPesos: prod.costCents / 100,
      totalPeriods: prod.totalPeriods,
      commissionPorc: prod.commissionBps / 100,
      insurancePesos: prod.insuranceCents / 100,
      interestPorc: prod.interestPerPeriodBps / 100
    };
    this.isProductoModalOpen = true;
  }
  cerrarEditProducto() {
    this.isEditProductoModalOpen = false; // DEPRECATED
    this.productoActivo = null;
  }
  abrirDeactivateProducto(prod: Product) {
    this.productoActivo = prod;
    this.isDeactivateProductoModalOpen = true; // DEPRECATED
  }
  cerrarDeactivateProducto() {
    this.isDeactivateProductoModalOpen = false; // DEPRECATED
    this.productoActivo = null;
  }

  // Confirmar Desactivación Genérica
  abrirConfirmacion(type: string, id: string) {
    this.entityToDeactivate = { type, id };
    this.isConfirmModalOpen = true;
  }

  ejecutarDesactivacion() {
    if (!this.entityToDeactivate) return;
    const { type, id } = this.entityToDeactivate;

    // Aquí iría la lógica HTTP según el tipo
    console.log(`Desactivando ${type} con ID: ${id}`);
    
    // Simulación
    if (type === 'producto') {
      const p = this.productos.find(x => x.code === id);
      if (p) p.isActive = false;
    } else if (type === 'sucursal') {
      this.branchService.deleteBranch(id).subscribe(() => {
        this.loadBranches(); // Reload after delete
      });
    } else if (['gerente', 'coordinador', 'verificador', 'cajero'].includes(type)) {
      let deleteAction;
      if (type === 'gerente') deleteAction = this.staffService.deactivateGerente(id);
      else if (type === 'coordinador') deleteAction = this.staffService.deactivateCoordinador(id);
      else if (type === 'verificador') deleteAction = this.staffService.deactivateVerificador(id);
      else deleteAction = this.staffService.deactivateCajero(id);

      deleteAction.subscribe(() => {
        this.loadStaff();
      });
    }

    this.isConfirmModalOpen = false;
    this.entityToDeactivate = null;
  }

  // Categorias
  abrirModalCategoria(cat?: any) { 
    if (cat) {
      this.isEditingMode = true;
      this.nuevaCategoria = { ...cat };
    } else {
      this.isEditingMode = false;
      this.nuevaCategoria = { nombre: '', ganancia: null };
    }
    this.isCategoriaModalOpen = true; 
  }
  cerrarModalCategoria() { this.isCategoriaModalOpen = false; this.isEditingMode = false; this.nuevaCategoria = { nombre: '', ganancia: null }; }
  guardarCategoria() {
    if (this.nuevaCategoria.nombre && this.nuevaCategoria.ganancia) {
      this.categorias.push({ ...this.nuevaCategoria } as any);
      this.cerrarModalCategoria();
    }
  }

  // Sucursales
  abrirModalSucursal(suc?: Branch) { 
    this.sucursalError = null;
    if (suc) {
      this.isEditingMode = true;
      this.nuevaSucursal = { 
        name: suc.name, 
        branchType: suc.branchType,
        esMatriz: suc.esMatriz,
        address: suc.address || '',
        managerUserId: suc.managerUserId || '',
        cutoffDay: suc.cutoffDay || 15,
        paymentDay: suc.paymentDay || 20,
        earlyPaymentDays: suc.earlyPaymentDays || 3
      };
      this.entityToDeactivate = { type: 'sucursal', id: suc.id }; 
    } else {
      this.isEditingMode = false;
      this.nuevaSucursal = { 
        name: '', 
        branchType: 'SUCURSAL', 
        esMatriz: false, 
        address: '',
        managerUserId: '',
        cutoffDay: 15,
        paymentDay: 20,
        earlyPaymentDays: 3
      };
    }
    this.isSucursalModalOpen = true; 
  }
  cerrarModalSucursal() { 
    this.isSucursalModalOpen = false; 
    this.isEditingMode = false; 
    this.sucursalError = null;
    this.nuevaSucursal = { name: '', branchType: 'SUCURSAL', esMatriz: false, address: '' }; 
    this.entityToDeactivate = null;
  }
  guardarSucursal() {
    this.sucursalError = null;
    if (this.nuevaSucursal.name && this.nuevaSucursal.branchType) {
      const payload = { ...this.nuevaSucursal };
      if (!payload.managerUserId || payload.managerUserId === '') {
        payload.managerUserId = null;
      }
      if (this.isEditingMode && this.entityToDeactivate) {
        this.branchService.updateBranch(this.entityToDeactivate.id, payload).subscribe({
          next: () => {
            this.loadBranches();
            this.cerrarModalSucursal();
          },
          error: (err) => {
            this.sucursalError = err.error?.message || err.message || 'Error al actualizar la sucursal.';
            this.cdr.detectChanges();
          }
        });
      } else {
        this.branchService.createBranch(payload).subscribe({
          next: () => {
            this.loadBranches();
            this.cerrarModalSucursal();
          },
          error: (err) => {
            this.sucursalError = err.error?.message || err.message || 'Error al crear la sucursal.';
            this.cdr.detectChanges();
          }
        });
      }
    }
  }

  // Personal
  abrirModalPersonal(emp?: any) { 
    this.personalError = null;
    if (emp) {
      this.isEditingMode = true;
      // Sólo enviamos campos que se pueden editar
      this.nuevoPersonal = { 
        firstName: emp.firstName,
        lastNamePaternal: emp.lastNamePaternal,
        lastNameMaternal: emp.lastNameMaternal || '',
        email: emp.email,
        phone: emp.phone || '',
        branchId: emp.branchId || ''
      };
      let tipo = this.activePersonalTab.substring(0, this.activePersonalTab.length - 1);
      if (this.activePersonalTab === 'gerentes') tipo = 'gerente';
      else if (this.activePersonalTab === 'coordinadores') tipo = 'coordinador';
      else if (this.activePersonalTab === 'verificadores') tipo = 'verificador';
      else tipo = 'cajero';
      this.entityToDeactivate = { type: tipo, id: emp.id };
    } else {
      this.isEditingMode = false;
      this.nuevoPersonal = { firstName: '', lastNamePaternal: '', lastNameMaternal: '', email: '', phone: '', branchId: '' };
    }
    this.isPersonalModalOpen = true; 
  }
  cerrarModalPersonal() { 
    this.isPersonalModalOpen = false; 
    this.isEditingMode = false;
    this.personalError = null;
    this.nuevoPersonal = { firstName: '', lastNamePaternal: '', lastNameMaternal: '', email: '', phone: '', branchId: '' }; 
  }
  guardarPersonal() {
    this.personalError = null;
    if (this.nuevoPersonal.firstName && this.nuevoPersonal.email) {
      const payload: any = { ...this.nuevoPersonal };
      if (!payload.branchId || payload.branchId === '') {
        delete payload.branchId;
      }
      if (this.activePersonalTab === 'gerentes') {
        payload.roleCode = 'GERENTE_SUCURSAL';
      }

      let saveAction: import('rxjs').Observable<any>;
      if (this.isEditingMode && this.entityToDeactivate) {
        const id = this.entityToDeactivate.id;
        saveAction = this.activePersonalTab === 'gerentes' ? this.staffService.updateGerente(id, payload) :
                     this.activePersonalTab === 'coordinadores' ? this.staffService.updateCoordinador(id, payload) :
                     this.activePersonalTab === 'verificadores' ? this.staffService.updateVerificador(id, payload) :
                     this.staffService.updateCajero(id, payload);
      } else {
        saveAction = this.activePersonalTab === 'gerentes' ? this.staffService.createGerente(payload) :
                     this.activePersonalTab === 'coordinadores' ? this.staffService.createCoordinador(payload) :
                     this.activePersonalTab === 'verificadores' ? this.staffService.createVerificador(payload) :
                     this.staffService.createCajero(payload);
      }

      saveAction.subscribe({
        next: () => {
          this.loadStaff();
          this.cerrarModalPersonal();
        },
        error: (err: any) => {
          this.personalError = err.error?.message || err.message || 'Error al guardar el empleado.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  // ==== DATATABLES EXT ====
  handleTableAction(event: {action: string, id: string}, type: string) {
    if (event.action === 'edit') {
      if (type === 'producto') {
        const p = this.productos.find(x => x.code === event.id);
        if (p) this.abrirEditProducto(p);
      } else if (type === 'categoria') {
        const c = this.categorias.find(x => x.nombre === event.id);
        if (c) this.abrirModalCategoria(c);
      } else if (type === 'sucursal') {
        const s = this.sucursales.find(x => x.id === event.id);
        if (s) this.abrirModalSucursal(s);
      } else if (['gerente', 'coordinador', 'verificador', 'cajero'].includes(type)) {
        let list: any[] = [];
        if (type === 'gerente') list = this.gerentes;
        if (type === 'coordinador') list = this.coordinadores;
        if (type === 'verificador') list = this.verificadores;
        if (type === 'cajero') list = this.cajeros;
        const emp = list.find(x => x.id === event.id);
        if (emp) this.abrirModalPersonal(emp);
      }
    } else if (event.action === 'deactivate') {
      this.abrirConfirmacion(type, event.id);
    }
  }
}
