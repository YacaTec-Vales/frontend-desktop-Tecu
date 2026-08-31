import { Component, OnInit, ChangeDetectorRef, ViewChild, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { InputComponent } from '../../../components/ui/input/input';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { TableActionsComponent } from '../../../components/ui/table/table-actions';
import { VpnOnlyDirective } from '../../../core/directives/vpn-only.directive';

import { BranchService } from '../../../core/services/branch.service';
import { StaffService } from '../../../core/services/staff.service';
import { ProductService, Product, CreateProductDto, UpdateProductDto } from '../../../core/services/product.service';
import { CategoryService, CreditCategory, CreateCategoryDto, UpdateCategoryDto } from '../../../core/services/category.service';
import { Branch, CreateBranchDto, UpdateBranchDto } from '../../../core/models/branch.model';
import { Coordinador, Verificador, Cajero, CreateStaffDto } from '../../../core/models/staff.model';
import {
  validateName,
  validateEmail,
  validatePhone,
  validateUsername,
} from '../../../core/validators/form-validators';

/**
 * Custom Validators para Reactive Forms que envuelven las funciones
 * puras del helper. Se usan igual que cualquier `Validators.*`.
 */
const nameValidator = (fieldName: string) => (control: { value: string | null | undefined }) => {
  const err = validateName(control.value, fieldName);
  return err ? { name: { message: err } } : null;
};

const emailValidator = () => (control: { value: string | null | undefined }) => {
  const err = validateEmail(control.value);
  return err ? { email: { message: err } } : null;
};

const phoneValidator = () => (control: { value: string | null | undefined }) => {
  const err = validatePhone(control.value);
  return err ? { phone: { message: err } } : null;
};

const usernameValidator = () => (control: { value: string | null | undefined }) => {
  const err = validateUsername(control.value);
  return err ? { username: { message: err } } : null;
};

type Tab = 'productos' | 'categorias' | 'sucursales' | 'personal';
type PersonalTab = 'gerentes' | 'coordinadores' | 'verificadores' | 'cajeros';

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, InputComponent, BadgeComponent, TableActionsComponent, VpnOnlyDirective],
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

  // Estado categorías
  categoriaError: string | null = null;
  isCategoriaLoading = false;
  isCategoriaLoaded = false;
  selectedCategoriaId: string | null = null;

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
  categoriasPage = 1; categoriasSearch = ''; categoriasTotal = 0;

  // Datos de categorías desde la API
  categorias: CreditCategory[] = [];

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
  productoSuccess: string | null = null;
  productoActivo: Product | null = null;

  constructor(
    private branchService: BranchService,
    private staffService: StaffService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private destroyRef: DestroyRef
  ) {
    this.productoForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern('^\\d{1,3}/\\d{1,3}$')]],
      variant: ['NORMAL', Validators.required],
      costPesos: [null, [Validators.required, Validators.min(1)]],
      totalPeriods: [null, [Validators.required, Validators.min(1), Validators.max(60)]],
      commissionPorc: [0, [Validators.required, Validators.min(0), Validators.max(1)]],
      insurancePesos: [0, [Validators.required, Validators.min(0)]],
      interestPorc: [0, [Validators.required, Validators.min(0), Validators.max(1)]],
      penaltyPesos: [0, [Validators.required, Validators.min(0)]]
    });

    this.sucursalForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), nameValidator('nombre de sucursal')]],
      branchType: ['SUCURSAL', Validators.required],
      cutoffDay: [15, [Validators.required, Validators.min(1), Validators.max(31)]],
      paymentDay: [20, [Validators.required, Validators.min(1), Validators.max(31)]],
      address: ['']
    });

    this.personalForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), usernameValidator()]],
      firstName: ['', [Validators.required, Validators.minLength(2), nameValidator('nombre')]],
      lastNamePaternal: ['', [Validators.required, Validators.minLength(2), nameValidator('apellido paterno')]],
      lastNameMaternal: ['', [Validators.required, Validators.minLength(2), nameValidator('apellido materno')]],
      email: ['', [Validators.required, emailValidator()]],
      phone: ['', [Validators.required, phoneValidator()]],
      branchId: ['']
    });

    this.categoriaForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), nameValidator('nombre de categoria')]],
      ganancia: [null, [Validators.required, Validators.min(0), Validators.max(1)]]
    });
  }

  /**
   * Helper: muestra `productoSuccess` por `delayMs` y luego la limpia
   * automaticamente. Si el usuario navega fuera del componente antes
   * del timeout (ej. logout), `takeUntilDestroyed` cancela la
   * suscripcion y evita el `cdr.detectChanges()` sobre un componente
   * destruido (BUG FIX 2026-08-31 startTime).
   */
  private flashProductoSuccess(msg: string, delayMs: number): void {
    this.productoSuccess = msg;
    timer(delayMs)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.productoSuccess = null;
        this.cdr.detectChanges();
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
      this.productService.getProducts(this.productosPage, this.productosLimit, this.productosSearch).subscribe({
        next: (res) => {
          this.productos = res.data || [];
          this.productosTotal = res.meta?.itemCount || res.data?.length || 0;
          this.isProductsLoaded = true;
          this.isProductsLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Error loading products:", err);
          this.isProductsLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else if (this.activeTab === 'categorias') {
      this.loadCategorias(forceRefresh);
    } else if (this.activeTab === 'sucursales') {
      this.loadSucursales(forceRefresh);
      this.loadGerentes(forceRefresh);
    } else if (this.activeTab === 'personal') {
      this.loadActivePersonalTab(forceRefresh);
    }
  }

  loadCategorias(force = false) {
    if (this.isCategoriaLoaded && !force) return;
    this.isCategoriaLoading = true;
    this.categoryService.getCategories(this.categoriasPage, this.categoriasLimit, this.categoriasSearch).subscribe({
      next: (res) => {
        this.categorias = res.data || [];
        this.categoriasTotal = res.meta?.itemCount || res.data?.length || 0;
        this.isCategoriaLoaded = true;
        this.isCategoriaLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // Fallback: si el endpoint no existe todavia, se mantienen datos locales
        this.isCategoriaLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadSucursales(force = false) {
    if (this.isBranchesLoaded && !force) return;
    this.isBranchesLoading = true;
    this.branchService.getBranches(this.sucursalesPage, this.sucursalesLimit, this.sucursalesSearch).subscribe({
      next: (res) => {
        this.sucursales = res.data || [];
        this.sucursalesTotal = res.meta?.itemCount || res.data?.length || 0;
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
        this.gerentes = res.data || [];
        this.gerentesTotal = res.meta?.itemCount || res.data?.length || 0;
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
        this.coordinadores = res.data || [];
        this.coordinadoresTotal = res.meta?.itemCount || res.data?.length || 0;
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
        this.verificadores = res.data || [];
        this.verificadoresTotal = res.meta?.itemCount || res.data?.length || 0;
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
        this.cajeros = res.data || [];
        this.cajerosTotal = res.meta?.itemCount || res.data?.length || 0;
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
    else if (type === 'categorias') { this.categoriasPage = page; this.loadCategorias(true); return; }
    this.loadActiveTab(true);
  }
  onSearch(term: string, type: string) {
    if (type === 'productos') { this.productosSearch = term; this.productosPage = 1; }
    else if (type === 'sucursales') { this.sucursalesSearch = term; this.sucursalesPage = 1; }
    else if (type === 'categorias') { this.categoriasSearch = term; this.categoriasPage = 1; this.loadCategorias(true); return; }
    this.loadActiveTab(true);
  }
  onLimitChange(limit: number, type: string) {
    if (type === 'productos') { this.productosLimit = limit; this.productosPage = 1; }
    else if (type === 'sucursales') { this.sucursalesLimit = limit; this.sucursalesPage = 1; }
    else if (type === 'categorias') { this.categoriasLimit = limit; this.categoriasPage = 1; this.loadCategorias(true); return; }
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
    this.productoError = null;
    this.isEditingMode = false;
    this.isProductoModalOpen = true;
    this.productoForm.reset({ variant: 'NORMAL', commissionPorc: 0, insurancePesos: 0, interestPorc: 0, penaltyPesos: 0 });
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
      const dto = {
        code: formValue.code,
        variant: formValue.variant,
        costCents: Math.round(formValue.costPesos! * 100),
        totalPeriods: formValue.totalPeriods!,
        commissionBps: Math.round(formValue.commissionPorc * 10000),
        insuranceCents: Math.round(formValue.insurancePesos * 100),
        interestPerPeriodBps: Math.round(formValue.interestPorc * 10000),
        penaltyCents: Math.round(formValue.penaltyPesos * 100)
      };
      
      if (this.isEditingMode && this.productoActivo) {
        // Modo Edición
        const updateDto: UpdateProductDto = {
          ...dto,
          isActive: this.productoActivo.isActive // Opcional, pero se envía por seguridad
        };
        this.productService.updateProduct(this.productoActivo.id, updateDto).subscribe({
          next: () => {
            this.flashProductoSuccess('Producto actualizado exitosamente.', 4000);
            this.loadActiveTab(true);
            this.cerrarModalProducto();
          },
          error: (err) => {
            this.productoError = err.error?.message || 'Error al actualizar el producto.';
            this.cdr.detectChanges();
          }
        });
      } else {
        // Modo Creación
        this.productService.createProduct(dto as CreateProductDto).subscribe({
          next: () => {
            this.productoSuccess = 'Producto creado exitosamente.';
            this.flashProductoSuccess('Producto creado exitosamente.', 4000);
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
  }

  // Edit / Deactivate Product (UI Only for now as API lacks endpoints)
  abrirEditProducto(prod: Product) {
    this.productoActivo = prod;
    this.isEditingMode = true;
    this.productoForm.patchValue({
      code: prod.code,
      variant: prod.variant as 'NORMAL' | 'PLUS',
      costPesos: prod.costCents / 100,
      totalPeriods: prod.totalPeriods,
      commissionPorc: prod.commissionBps / 10000,
      insurancePesos: prod.insuranceCents / 100,
      interestPorc: prod.interestPerPeriodBps / 10000,
      penaltyPesos: (prod.penaltyCents || 0) / 100
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

    if (type === 'categoria') {
      this.eliminarCategoria(id);
      return;
    }

    if (type === 'producto') {
      const p = this.productos.find(x => x.code === id);
      if (p) {
        this.productService.deleteProduct(p.id).subscribe({
          next: () => {
            this.flashProductoSuccess('Producto desactivado exitosamente.', 4000);
            this.loadActiveTab(true);
          },
          error: (err) => {
            console.error('Error al desactivar el producto:', err);
          }
        });
      }
    } else if (type === 'sucursal') {
      this.branchService.deleteBranch(id).subscribe(() => {
        this.loadActiveTab(true);
      });
    } else if (['gerente', 'coordinador', 'verificador', 'cajero'].includes(type)) {
      let deleteAction;
      if (type === 'gerente') deleteAction = this.staffService.deactivateGerente(id);
      else if (type === 'coordinador') deleteAction = this.staffService.deactivateCoordinador(id);
      else if (type === 'verificador') deleteAction = this.staffService.deactivateVerificador(id);
      else deleteAction = this.staffService.deactivateCajero(id);

      deleteAction.subscribe(() => {
        this.loadActivePersonalTab(true);
        // Si se desactiva un gerente, refrescar sucursales para reflejar
        // que la sucursal queda sin gerente asignado.
        if (type === 'gerente') {
          this.isBranchesLoaded = false;
          this.loadSucursales(true);
        }
      });
    }

    this.isConfirmModalOpen = false;
    this.entityToDeactivate = null;
  }

  // Categorias
  abrirModalCategoria(cat?: CreditCategory) {
    this.categoriaError = null;
    this.selectedCategoriaId = null;
    if (cat) {
      this.isEditingMode = true;
      this.selectedCategoriaId = cat.id;
      // Convertimos bps => porcentaje para mostrarlo en el campo del formulario
      this.categoriaForm.patchValue({
        name: cat.name,
        ganancia: cat.commissionBps / 10000
      });
    } else {
      this.isEditingMode = false;
      this.categoriaForm.reset();
    }
    this.isCategoriaModalOpen = true;
  }

  cerrarModalCategoria() {
    this.isCategoriaModalOpen = false;
    this.isEditingMode = false;
    this.categoriaError = null;
    this.selectedCategoriaId = null;
    this.categoriaForm.reset();
  }

  guardarCategoria() {
    this.categoriaError = null;
    if (!this.categoriaForm.valid) return;

    const formValue = this.categoriaForm.value;
    // El usuario ingresa decimal (Ej: 0.065), lo convertimos a bps (650)
    const commissionBps = Math.round(formValue.ganancia * 10000);

    if (this.isEditingMode && this.selectedCategoriaId) {
      // EDITAR — PATCH /api/v1/categories/:id
      const dto: UpdateCategoryDto = {
        name: formValue.name,
        commissionBps
      };
      this.categoryService.updateCategory(this.selectedCategoriaId, dto).subscribe({
        next: () => {
          this.isCategoriaLoaded = false;
          this.loadCategorias(true);
          this.cerrarModalCategoria();
        },
        error: (err) => {
          this.categoriaError = err.error?.message || 'Error al actualizar la categoría.';
          this.cdr.detectChanges();
        }
      });
    } else {
      // CREAR — POST /api/v1/categories
      const dto: CreateCategoryDto = { name: formValue.name, commissionBps };
      this.categoryService.createCategory(dto).subscribe({
        next: () => {
          this.isCategoriaLoaded = false;
          this.loadCategorias(true);
          this.cerrarModalCategoria();
        },
        error: (err) => {
          this.categoriaError = err.error?.message || 'Error al crear la categoría.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  eliminarCategoria(id: string) {
    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.isCategoriaLoaded = false;
        this.loadCategorias(true);
        this.isConfirmModalOpen = false;
        this.entityToDeactivate = null;
      },
      error: (err) => {
        console.error('Error al eliminar categoría:', err);
      }
    });
  }

  getTodayDateStr(): string {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${mm}-${dd}`;
  }

  onCutoffDateChange(val: string) {
    if (val) {
      this.sucursalForm.patchValue({ cutoffDay: parseInt(val.split('-')[2], 10) });
    }
  }

  onPaymentDateChange(val: string) {
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
        address: suc.address || '',
        cutoffDay: suc.cutoffDay,
        paymentDay: suc.paymentDay
      });
      this.entityToDeactivate = { type: 'sucursal', id: suc.id };
    } else {
      this.isEditingMode = false;
      this.sucursalForm.reset({
        branchType: 'SUCURSAL',
        cutoffDay: 15,
        paymentDay: 20
      });
    }
    this.isSucursalModalOpen = true;
  }
  cerrarModalSucursal() { 
    this.isSucursalModalOpen = false; 
    this.isEditingMode = false; 
    this.sucursalError = null;
    this.sucursalForm.reset({ branchType: 'SUCURSAL' }); 
    this.entityToDeactivate = null;
  }
  guardarSucursal() {
    this.sucursalError = null;
    if (this.sucursalForm.valid) {
      const formVal = this.sucursalForm.value;
      let prefix = '';
      if (formVal.name && formVal.name.length >= 3) {
        prefix = formVal.name.substring(0, 3).toUpperCase();
      } else {
        prefix = 'SUC';
      }

      if (formVal.cutoffDay === null || formVal.cutoffDay === undefined ||
          formVal.paymentDay === null || formVal.paymentDay === undefined) {
        this.sucursalError = 'Debes especificar dia de corte y dia de pago.';
        this.cdr.detectChanges();
        return;
      }

      const payload: any = {
        name: formVal.name,
        branchType: formVal.branchType,
        esMatriz: formVal.branchType === 'MATRIZ',
        address: formVal.address || "",
        folioPrefix: prefix,
        cutoffDay: formVal.cutoffDay,
        paymentDay: formVal.paymentDay,
        cutoffs: [
          {
            position: 1,
            cutoffDay: formVal.cutoffDay,
            paymentDay: formVal.paymentDay,
            cutoffTime: "14:30",
            paymentTime: "18:00"
          },
          {
            position: 2,
            cutoffDay: formVal.cutoffDay === 15 ? 28 : (formVal.cutoffDay + 14) % 30 || 30,
            paymentDay: formVal.paymentDay === 20 ? 5 : (formVal.paymentDay + 14) % 30 || 30,
            cutoffTime: "14:30",
            paymentTime: "18:00"
          }
        ]
      };

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
    } else {
      this.sucursalForm.markAllAsTouched();
      this.sucursalError = 'Completa todos los campos requeridos.';
      this.cdr.detectChanges();
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
          // Si el cambio involucra un gerente (crear/editar/reasignar),
          // refrescamos la tabla de sucursales para que se vea reflejado
          // el gerente asignado a cada sucursal.
          if (this.activePersonalTab === 'gerentes') {
            this.isBranchesLoaded = false;
            this.loadSucursales(true);
          }
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
        // Buscamos por id en lugar de nombre
        const c = this.categorias.find(x => x.id === event.id);
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
      if (type === 'categoria') {
        // Para categorias usamos eliminarCategoria directamente
        this.entityToDeactivate = { type, id: event.id };
        this.isConfirmModalOpen = true;
      } else {
        this.abrirConfirmacion(type, event.id);
      }
    }
  }
}
