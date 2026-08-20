import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
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
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, InputComponent, BadgeComponent, TableActionsComponent],
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
  isGerentesLoaded = false;
  isCoordinadoresLoaded = false;
  isVerificadoresLoaded = false;
  isCajerosLoaded = false;

  isProductsLoading = false;
  isBranchesLoading = false;
  isGerentesLoading = false;
  isCoordinadoresLoading = false;
  isVerificadoresLoading = false;
  isCajerosLoading = false;
  
  // Limits
  productosLimit = 10;
  sucursalesLimit = 10;
  categoriasLimit = 10;
  gerentesLimit = 10;
  coordinadoresLimit = 10;
  verificadoresLimit = 10;
  cajerosLimit = 10;

  // Pagination & Search States
  productosPage = 1; productosTotal = 0; productosSearch = '';
  sucursalesPage = 1; sucursalesTotal = 0; sucursalesSearch = '';
  gerentesPage = 1; gerentesTotal = 0; gerentesSearch = '';
  coordinadoresPage = 1; coordinadoresTotal = 0; coordinadoresSearch = '';
  verificadoresPage = 1; verificadoresTotal = 0; verificadoresSearch = '';
  cajerosPage = 1; cajerosTotal = 0; cajerosSearch = '';
  categoriasPage = 1; categoriasSearch = '';
  
  // -- Datos Dummy (Categorías) --
  categorias = [
    { nombre: 'Plata', ganancia: 6 },
    { nombre: 'Oro', ganancia: 10 },
  ];

  get paginatedCategorias() {
    let filtradas = this.categorias;
    if (this.categoriasSearch) {
      const q = this.categoriasSearch.toLowerCase();
      filtradas = filtradas.filter(c => c.nombre.toLowerCase().includes(q));
    }
    const start = (this.categoriasPage - 1) * this.categoriasLimit;
    return filtradas.slice(start, start + this.categoriasLimit);
  }

  get totalCategorias() {
    if (!this.categoriasSearch) return this.categorias.length;
    const q = this.categoriasSearch.toLowerCase();
    return this.categorias.filter(c => c.nombre.toLowerCase().includes(q)).length;
  }

  // API Data
  productos: Product[] = [];
  sucursales: Branch[] = [];
  gerentes: any[] = [];
  coordinadores: Coordinador[] = [];
  verificadores: Verificador[] = [];
  cajeros: Cajero[] = [];

  productoForm: FormGroup;
  sucursalForm: FormGroup;
  personalForm: FormGroup;
  categoriaForm: FormGroup;

  sucursalError: string | null = null;
  personalError: string | null = null;
  productoError: string | null = null;
  productoActivo: Product | null = null;

  constructor(
    private branchService: BranchService,
    private staffService: StaffService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.productoForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern('^\\d{1,3}/\\d{1,3}$')]],
      variant: ['NORMAL', Validators.required],
      costPesos: [null, [Validators.required, Validators.min(1)]],
      totalPeriods: [null, [Validators.required, Validators.min(1), Validators.max(60)]],
      commissionPorc: [0, [Validators.required, Validators.min(0)]],
      insurancePesos: [0, [Validators.required, Validators.min(0)]],
      interestPorc: [0, [Validators.required, Validators.min(0)]]
    });

    this.sucursalForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      branchType: ['SUCURSAL', Validators.required],
      esMatriz: [false],
      managerUserId: [''],
      cutoffDay: [15, [Validators.required, Validators.min(1), Validators.max(31)]],
      paymentDay: [20, [Validators.required, Validators.min(1), Validators.max(31)]],
      earlyPaymentDays: [3, [Validators.required, Validators.min(0)]],
      address: ['']
    });

    this.personalForm = this.fb.group({
      username: [''],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastNamePaternal: ['', [Validators.required, Validators.minLength(2)]],
      lastNameMaternal: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      branchId: ['']
    });

    this.categoriaForm = this.fb.group({
      nombre: ['', Validators.required],
      ganancia: [null, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.loadActiveTab();
  }

  loadActiveTab(forceRefresh: boolean = false) {
    if (this.activeTab === 'productos') {
      if (this.isProductsLoaded && !forceRefresh) return;
      this.isProductsLoaded = false;
      this.isProductsLoading = true;
      this.productService.getProducts(this.productosPage, this.productosLimit, this.productosSearch).subscribe(res => {
        this.productos = res.data;
        this.productosTotal = res.meta.itemCount;
        this.isProductsLoaded = true;
        this.isProductsLoading = false;
        this.cdr.detectChanges();
      });
    } else if (this.activeTab === 'sucursales') {
      this.loadSucursales(forceRefresh);
    } else if (this.activeTab === 'personal') {
      this.loadActivePersonalTab(forceRefresh);
    }
  }

  loadSucursales(force = false) {
    if (this.isBranchesLoaded && !force) return;
    this.isBranchesLoading = true;
    this.branchService.getBranches(this.sucursalesPage, this.sucursalesLimit, this.sucursalesSearch).subscribe({
      next: (res) => {
        this.sucursales = res.data;
        this.sucursalesTotal = res.meta.itemCount;
        this.isBranchesLoaded = true;
        this.isBranchesLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isBranchesLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadActivePersonalTab(forceRefresh: boolean = false) {
    if (this.activePersonalTab === 'gerentes') {
      this.loadGerentes(forceRefresh);
    } else if (this.activePersonalTab === 'coordinadores') {
      this.loadCoordinadores(forceRefresh);
    } else if (this.activePersonalTab === 'verificadores') {
      this.loadVerificadores(forceRefresh);
    } else if (this.activePersonalTab === 'cajeros') {
      this.loadCajeros(forceRefresh);
    }
  }

  loadGerentes(force = false) {
    if (this.isGerentesLoaded && !force) return;
    this.isGerentesLoading = true;
    this.staffService.getGerentes(this.gerentesPage, this.gerentesLimit, this.gerentesSearch).subscribe({
      next: (res: any) => {
        this.gerentes = res.data;
        this.gerentesTotal = res.meta.itemCount;
        this.isGerentesLoaded = true;
        this.isGerentesLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isGerentesLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCoordinadores(force = false) {
    if (this.isCoordinadoresLoaded && !force) return;
    this.isCoordinadoresLoading = true;
    this.staffService.getCoordinadores(this.coordinadoresPage, this.coordinadoresLimit, this.coordinadoresSearch).subscribe({
      next: (res: any) => {
        this.coordinadores = res.data;
        this.coordinadoresTotal = res.meta.itemCount;
        this.isCoordinadoresLoaded = true;
        this.isCoordinadoresLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isCoordinadoresLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadVerificadores(force = false) {
    if (this.isVerificadoresLoaded && !force) return;
    this.isVerificadoresLoading = true;
    this.staffService.getVerificadores(this.verificadoresPage, this.verificadoresLimit, this.verificadoresSearch).subscribe({
      next: (res: any) => {
        this.verificadores = res.data;
        this.verificadoresTotal = res.meta.itemCount;
        this.isVerificadoresLoaded = true;
        this.isVerificadoresLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isVerificadoresLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCajeros(force = false) {
    if (this.isCajerosLoaded && !force) return;
    this.isCajerosLoading = true;
    this.staffService.getCajeros(this.cajerosPage, this.cajerosLimit, this.cajerosSearch).subscribe({
      next: (res: any) => {
        this.cajeros = res.data;
        this.cajerosTotal = res.meta.itemCount;
        this.isCajerosLoaded = true;
        this.isCajerosLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isCajerosLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getBranchName(branchId: string | null | undefined): string {
    if (!branchId) return 'N/A';
    const sucursal = this.sucursales.find(s => s.id === branchId);
    return sucursal ? sucursal.name : 'Desconocida';
  }

  setTab(tab: Tab) {
    if (this.activeTab !== tab) {
      this.activeTab = tab;
      this.loadActiveTab();
    }
  }

  refreshProductsTable() {}
  refreshBranchesTable() {}
  refreshPersonalTable() {}

  setPersonalTab(tab: PersonalTab) {
    if (this.activePersonalTab !== tab) {
      this.activePersonalTab = tab;
      this.loadActivePersonalTab();
    }
  }

  // Paginación principal
  onPageChange(page: number, type: string) {
    if (type === 'productos') { this.productosPage = page; }
    else if (type === 'sucursales') { this.sucursalesPage = page; }
    else if (type === 'categorias') { this.categoriasPage = page; return; }
    this.loadActiveTab(true);
  }
  onSearch(term: string, type: string) {
    if (type === 'productos') { this.productosSearch = term; this.productosPage = 1; }
    else if (type === 'sucursales') { this.sucursalesSearch = term; this.sucursalesPage = 1; }
    else if (type === 'categorias') { this.categoriasSearch = term; this.categoriasPage = 1; return; }
    this.loadActiveTab(true);
  }
  onLimitChange(limit: number, type: string) {
    if (type === 'productos') { this.productosLimit = limit; this.productosPage = 1; }
    else if (type === 'sucursales') { this.sucursalesLimit = limit; this.sucursalesPage = 1; }
    else if (type === 'categorias') { this.categoriasLimit = limit; this.categoriasPage = 1; return; }
    this.loadActiveTab(true);
  }

  // Paginación Personal
  onPersonalPageChange(page: number, type: string) {
    if (type === 'gerentes') { this.gerentesPage = page; }
    else if (type === 'coordinadores') { this.coordinadoresPage = page; }
    else if (type === 'verificadores') { this.verificadoresPage = page; }
    else if (type === 'cajeros') { this.cajerosPage = page; }
    this.loadActivePersonalTab(true);
  }
  onPersonalSearch(term: string, type: string) {
    if (type === 'gerentes') { this.gerentesSearch = term; this.gerentesPage = 1; }
    else if (type === 'coordinadores') { this.coordinadoresSearch = term; this.coordinadoresPage = 1; }
    else if (type === 'verificadores') { this.verificadoresSearch = term; this.verificadoresPage = 1; }
    else if (type === 'cajeros') { this.cajerosSearch = term; this.cajerosPage = 1; }
    this.loadActivePersonalTab(true);
  }
  onPersonalLimitChange(limit: number, type: string) {
    if (type === 'gerentes') { this.gerentesLimit = limit; this.gerentesPage = 1; }
    else if (type === 'coordinadores') { this.coordinadoresLimit = limit; this.coordinadoresPage = 1; }
    else if (type === 'verificadores') { this.verificadoresLimit = limit; this.verificadoresPage = 1; }
    else if (type === 'cajeros') { this.cajerosLimit = limit; this.cajerosPage = 1; }
    this.loadActivePersonalTab(true);
  }

  // Productos
  abrirModalProducto() { 
    this.isEditingMode = false;
    this.productoError = null;
    this.productoForm.reset({ variant: 'NORMAL', commissionPorc: 0, insurancePesos: 0, interestPorc: 0 });
    this.isProductoModalOpen = true; 
  }
  cerrarModalProducto() { 
    this.isProductoModalOpen = false; 
    this.isEditingMode = false;
    this.productoError = null;
    this.productoForm.reset({ variant: 'NORMAL', commissionPorc: 0, insurancePesos: 0, interestPorc: 0 });
  }

  guardarProducto() {
    this.productoError = null;
    if (this.productoForm.valid) {
      const formValue = this.productoForm.value;
      const dto: CreateProductDto = {
        code: formValue.code,
        variant: formValue.variant,
        costCents: Math.round(formValue.costPesos! * 100),
        totalPeriods: formValue.totalPeriods!,
        commissionBps: Math.round(formValue.commissionPorc * 100),
        insuranceCents: Math.round(formValue.insurancePesos * 100),
        interestPerPeriodBps: Math.round(formValue.interestPorc * 100)
      };
      
      this.productService.createProduct(dto).subscribe({
        next: () => {
          this.loadActiveTab(true);
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
    this.productoForm.patchValue({
      code: prod.code,
      variant: prod.variant as 'NORMAL' | 'PLUS',
      costPesos: prod.costCents / 100,
      totalPeriods: prod.totalPeriods,
      commissionPorc: prod.commissionBps / 100,
      insurancePesos: prod.insuranceCents / 100,
      interestPorc: prod.interestPerPeriodBps / 100
    });
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
        this.loadActiveTab(true); // Reload after delete
      });
    } else if (['gerente', 'coordinador', 'verificador', 'cajero'].includes(type)) {
      let deleteAction;
      if (type === 'gerente') deleteAction = this.staffService.deactivateGerente(id);
      else if (type === 'coordinador') deleteAction = this.staffService.deactivateCoordinador(id);
      else if (type === 'verificador') deleteAction = this.staffService.deactivateVerificador(id);
      else deleteAction = this.staffService.deactivateCajero(id);

      deleteAction.subscribe(() => {
        this.loadActivePersonalTab(true);
      });
    }

    this.isConfirmModalOpen = false;
    this.entityToDeactivate = null;
  }

  // Categorias
  abrirModalCategoria(cat?: any) { 
    if (cat) {
      this.isEditingMode = true;
      this.categoriaForm.patchValue(cat);
    } else {
      this.isEditingMode = false;
      this.categoriaForm.reset();
    }
    this.isCategoriaModalOpen = true; 
  }
  cerrarModalCategoria() { this.isCategoriaModalOpen = false; this.isEditingMode = false; this.categoriaForm.reset(); }
  guardarCategoria() {
    if (this.categoriaForm.valid) {
      this.categorias.push({ ...this.categoriaForm.value } as any);
      this.cerrarModalCategoria();
    }
  }

  tempCutoffDateFull: string = '';
  tempPaymentDateFull: string = '';

  getTodayDateStr(): string {
    const d = new Date();
    // We adjust timezone offset if needed, or simply build the YYYY-MM-DD
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();
    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }

  onCutoffDateChange(val: string) {
    this.tempCutoffDateFull = val;
    if (val) {
      this.sucursalForm.patchValue({ cutoffDay: parseInt(val.split('-')[2], 10) });
    }
  }

  onPaymentDateChange(val: string) {
    this.tempPaymentDateFull = val;
    if (val) {
      this.sucursalForm.patchValue({ paymentDay: parseInt(val.split('-')[2], 10) });
    }
  }

  // Sucursales
  abrirModalSucursal(suc?: Branch) { 
    this.sucursalError = null;
    const now = new Date();
    
    if (suc) {
      this.isEditingMode = true;
      this.sucursalForm.patchValue({ 
        name: suc.name, 
        branchType: suc.branchType,
        esMatriz: suc.esMatriz,
        address: suc.address || '',
        managerUserId: suc.managerUserId || '',
        cutoffDay: suc.cutoffDay || 15,
        paymentDay: suc.paymentDay || 20,
        earlyPaymentDays: suc.earlyPaymentDays || 3
      });
      now.setDate(suc.cutoffDay || 15);
      this.tempCutoffDateFull = [now.getFullYear(), (now.getMonth() + 1).toString().padStart(2, '0'), now.getDate().toString().padStart(2, '0')].join('-');
      now.setDate(suc.paymentDay || 20);
      this.tempPaymentDateFull = [now.getFullYear(), (now.getMonth() + 1).toString().padStart(2, '0'), now.getDate().toString().padStart(2, '0')].join('-');
      this.entityToDeactivate = { type: 'sucursal', id: suc.id }; 
    } else {
      this.isEditingMode = false;
      this.sucursalForm.reset({ 
        branchType: 'SUCURSAL', 
        esMatriz: false, 
        cutoffDay: 15,
        paymentDay: 20,
        earlyPaymentDays: 3
      });
      now.setDate(15);
      this.tempCutoffDateFull = [now.getFullYear(), (now.getMonth() + 1).toString().padStart(2, '0'), now.getDate().toString().padStart(2, '0')].join('-');
      now.setDate(20);
      this.tempPaymentDateFull = [now.getFullYear(), (now.getMonth() + 1).toString().padStart(2, '0'), now.getDate().toString().padStart(2, '0')].join('-');
    }
    this.isSucursalModalOpen = true; 
  }
  cerrarModalSucursal() { 
    this.isSucursalModalOpen = false; 
    this.isEditingMode = false; 
    this.sucursalError = null;
    this.sucursalForm.reset({ branchType: 'SUCURSAL', esMatriz: false }); 
    this.entityToDeactivate = null;
  }
  guardarSucursal() {
    this.sucursalError = null;
    if (this.sucursalForm.valid) {
      const payload: any = { ...this.sucursalForm.value };
      if (!payload.managerUserId || payload.managerUserId === '') {
        delete payload.managerUserId;
      }

      if (this.isEditingMode && this.entityToDeactivate) {
        this.branchService.updateBranch(this.entityToDeactivate.id, payload).subscribe({
          next: () => {
            this.loadActiveTab(true);
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
            this.loadActiveTab(true);
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
      this.personalForm.patchValue({ 
        username: emp.username || '',
        firstName: emp.firstName,
        lastNamePaternal: emp.lastNamePaternal,
        lastNameMaternal: emp.lastNameMaternal || '',
        email: emp.email,
        phone: emp.phone || '',
        branchId: emp.branchId || ''
      });
      let tipo = this.activePersonalTab.substring(0, this.activePersonalTab.length - 1);
      if (this.activePersonalTab === 'gerentes') tipo = 'gerente';
      else if (this.activePersonalTab === 'coordinadores') tipo = 'coordinador';
      else if (this.activePersonalTab === 'verificadores') tipo = 'verificador';
      else tipo = 'cajero';
      this.entityToDeactivate = { type: tipo, id: emp.id };
    } else {
      this.isEditingMode = false;
      this.personalForm.reset({ branchId: '' });
    }
    this.isPersonalModalOpen = true; 
  }
  cerrarModalPersonal() { 
    this.isPersonalModalOpen = false; 
    this.isEditingMode = false;
    this.personalError = null;
    this.personalForm.reset({ branchId: '' }); 
  }
  guardarPersonal() {
    this.personalError = null;
    if (this.personalForm.valid) {
      const payload: any = { ...this.personalForm.value };
      if (!payload.branchId || payload.branchId === '') {
        delete payload.branchId;
      }
      if (this.activePersonalTab === 'gerentes') {
        payload.roleCode = 'GERENTE_SUCURSAL';
      }

      let saveAction: import('rxjs').Observable<any>;
      if (this.isEditingMode && this.entityToDeactivate) {
        const id = this.entityToDeactivate.id;
        if (this.activePersonalTab === 'gerentes') saveAction = this.staffService.updateGerente(id, payload);
        else if (this.activePersonalTab === 'coordinadores') { delete payload.username; saveAction = this.staffService.updateCoordinador(id, payload); }
        else if (this.activePersonalTab === 'verificadores') { delete payload.username; saveAction = this.staffService.updateVerificador(id, payload); }
        else { delete payload.username; saveAction = this.staffService.updateCajero(id, payload); }
      } else {
        if (this.activePersonalTab === 'gerentes') saveAction = this.staffService.createGerente(payload);
        else if (this.activePersonalTab === 'coordinadores') { delete payload.username; saveAction = this.staffService.createCoordinador(payload); }
        else if (this.activePersonalTab === 'verificadores') { delete payload.username; saveAction = this.staffService.createVerificador(payload); }
        else { delete payload.username; saveAction = this.staffService.createCajero(payload); }
      }

      saveAction.subscribe({
        next: () => {
          this.loadActivePersonalTab(true);
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
