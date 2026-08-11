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
type PersonalTab = 'coordinadores' | 'verificadores' | 'cajeros';

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, InputComponent, BadgeComponent, TableActionsComponent],
  templateUrl: './catalogos.component.html'
})
export class CatalogosComponent implements OnInit {
  activeTab: Tab = 'productos';
  activePersonalTab: PersonalTab = 'coordinadores';

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
    if (this.coordinadores.length > 0 || this.verificadores.length > 0 || this.cajeros.length > 0) {
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
    if (suc) {
      this.isEditingMode = true;
      this.nuevaSucursal = { 
        name: suc.name, 
        branchType: suc.branchType,
        esMatriz: suc.esMatriz,
        address: suc.address || ''
      };
      // We will need the ID later for update. We can store it in a temporary variable or the active entity.
      this.entityToDeactivate = { type: 'sucursal', id: suc.id }; 
    } else {
      this.isEditingMode = false;
      this.nuevaSucursal = { name: '', branchType: 'SUCURSAL', esMatriz: false, address: '' };
    }
    this.isSucursalModalOpen = true; 
  }
  cerrarModalSucursal() { 
    this.isSucursalModalOpen = false; 
    this.isEditingMode = false; 
    this.nuevaSucursal = { name: '', branchType: 'SUCURSAL', esMatriz: false, address: '' }; 
    this.entityToDeactivate = null;
  }
  guardarSucursal() {
    if (this.nuevaSucursal.name && this.nuevaSucursal.branchType) {
      if (this.isEditingMode && this.entityToDeactivate) {
        this.branchService.updateBranch(this.entityToDeactivate.id, this.nuevaSucursal).subscribe(() => {
          this.loadBranches();
          this.cerrarModalSucursal();
        });
      } else {
        this.branchService.createBranch(this.nuevaSucursal).subscribe(() => {
          this.loadBranches();
          this.cerrarModalSucursal();
        });
      }
    }
  }

  // Personal
  abrirModalPersonal(emp?: any) { 
    if (emp) {
      this.isEditingMode = true;
      this.nuevoPersonal = { ...emp };
    } else {
      this.isEditingMode = false;
      this.nuevoPersonal = { firstName: '', lastNamePaternal: '', lastNameMaternal: '', email: '', phone: '', branchId: '' };
    }
    this.isPersonalModalOpen = true; 
  }
  cerrarModalPersonal() { 
    this.isPersonalModalOpen = false; 
    this.isEditingMode = false;
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
      } else if (['coordinador', 'verificador', 'cajero'].includes(type)) {
        let list: any[] = [];
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
