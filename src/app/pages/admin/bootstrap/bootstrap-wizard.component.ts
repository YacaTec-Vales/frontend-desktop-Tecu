import { Component, OnInit, inject, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BootstrapService, BootstrapStatus } from '../../../core/services/bootstrap.service';
import { AuthService } from '../../../core/services/auth.service';
import { BranchService } from '../../../core/services/branch.service';
import type { Branch } from '../../../core/models/branch.model';

type Step = 'matriz' | 'gerente-general' | 'done' | 'transfer-matriz' | 'transfer-done';

/**
 * Wizard de bootstrap inicial del sistema.
 *
 * Solo el ADMINISTRADOR llega aqui (ruta `/admin/bootstrap` protegida por
 * `roleGuard(['ADMINISTRADOR'])`). El wizard tiene 2 modos:
 *
 *  1. **Creacion inicial** (pasos matriz -> gerente-general -> done):
 *     el admin es el unico con los permisos `branch.create.matriz` y
 *     `user.create.general_manager`. Si el sistema NO esta inicializado,
 *     este es el flujo.
 *
 *  2. **Transferir matriz** (pasos transfer-matriz -> transfer-done):
 *     cuando el sistema YA esta inicializado pero el admin quiere rotar
 *     la cualidad de matriz a otra sucursal existente. Se accede desde
 *     el dashboard con `?mode=transfer-matriz`. Requiere permiso
 *     `branch.transfer.matriz`.
 *
 * Si el sistema ya esta inicializado y NO se pidio modo transfer, el
 * wizard se autoredirige al dashboard.
 */
@Component({
  selector: 'app-bootstrap-wizard',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bootstrap-wizard.component.html',
})
export class BootstrapWizardComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bootstrapService = inject(BootstrapService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private branchService = inject(BranchService);
  private cdr = inject(ChangeDetectorRef);

  /** Modo del wizard detectado al cargar. */
  readonly mode = signal<'create' | 'transfer'>('create');

  /** Paso actual del wizard. */
  currentStep = signal<Step>('matriz');

  /** Datos del bootstrap en curso. */
  matrizId = signal<string | null>(null);
  matrizName = signal<string | null>(null);
  generalManagerId = signal<string | null>(null);
  generalManagerEmail = signal<string | null>(null);
  transferredFromId = signal<string | null>(null);
  transferredToId = signal<string | null>(null);
  transferredToName = signal<string | null>(null);

  /** Sucursales disponibles para transferir la matriz. */
  availableBranches = signal<Branch[]>([]);
  isLoadingBranches = signal(false);

  /** Errores por paso. */
  matrizError = signal<string | null>(null);
  ggError = signal<string | null>(null);
  transferError = signal<string | null>(null);

  /** Loading por paso. */
  isLoadingMatriz = signal(false);
  isLoadingGg = signal(false);
  isLoadingTransfer = signal(false);

  /** Forms reactivos con validaciones alineadas al backend. */
  matrizForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    folioPrefix: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]],
    address: [''],
    cutoffDay: [15, [Validators.min(1), Validators.max(31)]],
    paymentDay: [20, [Validators.min(1), Validators.max(31)]],
  });

  ggForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    lastNamePaternal: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    lastNameMaternal: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    phone: [''],
  });

  transferForm: FormGroup = this.fb.group({
    branchId: ['', [Validators.required]],
    confirm: [false, [Validators.requiredTrue]],
  });

  /** Numero del paso actual (1..N) para mostrar progreso. */
  readonly stepNumber = computed(() => {
    switch (this.currentStep()) {
      case 'matriz':
        return 1;
      case 'gerente-general':
        return 2;
      case 'done':
        return 3;
      case 'transfer-matriz':
        return 1;
      case 'transfer-done':
        return 2;
    }
  });

  readonly totalSteps = computed(() => (this.mode() === 'transfer' ? 2 : 3));

  ngOnInit(): void {
    const requestedMode = this.route.snapshot.queryParamMap.get('mode');
    if (requestedMode === 'transfer-matriz') {
      this.mode.set('transfer');
      this.currentStep.set('transfer-matriz');
      void this.loadBranches();
      return;
    }
    // Modo creacion: redirigir al dashboard si ya esta inicializado.
    this.bootstrapService.getSystemStatus().subscribe({
      next: (s) => {
        if (s.bootstrapComplete) {
          this.router.navigate(['/admin/dashboard']);
        } else if (s.matrizId) {
          this.matrizId.set(s.matrizId);
          this.matrizName.set(s.matrizName ?? null);
          this.currentStep.set('gerente-general');
        }
        this.cdr.detectChanges();
      },
    });
  }

  /** Carga las sucursales disponibles para transferir la matriz. */
  async loadBranches(): Promise<void> {
    this.isLoadingBranches.set(true);
    this.branchService.listBranches({ page: 1, limit: 100, esMatriz: false }).subscribe({
      next: (res) => {
        this.availableBranches.set(res.data ?? []);
        this.isLoadingBranches.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingBranches.set(false);
        this.transferError.set('No se pudieron cargar las sucursales.');
        this.cdr.detectChanges();
      },
    });
  }

  submitMatriz(): void {
    this.matrizError.set(null);
    if (this.matrizForm.invalid) {
      this.matrizForm.markAllAsTouched();
      return;
    }
    this.isLoadingMatriz.set(true);
    const payload = this.matrizForm.value;
    this.bootstrapService.createMatriz(payload).subscribe({
      next: (res: any) => {
        this.isLoadingMatriz.set(false);
        this.matrizId.set(res?.id ?? null);
        this.matrizName.set(res?.name ?? null);
        this.currentStep.set('gerente-general');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingMatriz.set(false);
        const code = err?.error?.code;
        if (code === 'BRANCH.MATRIZ_ALREADY_EXISTS') {
          this.matrizError.set(
            'Ya existe una MATRIZ activa. El sistema rechaza una segunda. Refresca la pagina.',
          );
        } else {
          this.matrizError.set(
            err?.error?.message ||
              'Error al crear la sucursal MATRIZ. Intente nuevamente.',
          );
        }
        this.cdr.detectChanges();
      },
    });
  }

  submitGerenteGeneral(): void {
    this.ggError.set(null);
    if (this.ggForm.invalid) {
      this.ggForm.markAllAsTouched();
      return;
    }
    this.isLoadingGg.set(true);
    const payload = this.ggForm.value;
    this.bootstrapService.createGerenteGeneral(payload).subscribe({
      next: (res: any) => {
        this.isLoadingGg.set(false);
        this.generalManagerId.set(res?.id ?? null);
        this.generalManagerEmail.set(payload.email);
        this.currentStep.set('done');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingGg.set(false);
        const code = err?.error?.code;
        if (code === 'USERS.GENERAL_MANAGER_ALREADY_EXISTS') {
          this.ggError.set(
            'Ya existe un Gerente General activo. El sistema solo permite uno a la vez.',
          );
        } else if (code === 'USERS.EMAIL_ALREADY_EXISTS') {
          this.ggError.set('El correo electronico ya esta registrado. Usa otro.');
        } else if (code === 'USERS.USERNAME_ALREADY_EXISTS') {
          this.ggError.set('El nombre de usuario ya esta registrado. Usa otro.');
        } else {
          this.ggError.set(
            err?.error?.message ||
              'Error al crear el Gerente General. Intente nuevamente.',
          );
        }
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Ejecuta la transferencia de la cualidad de matriz a la sucursal
   * seleccionada.
   */
  submitTransfer(): void {
    this.transferError.set(null);
    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      return;
    }
    this.isLoadingTransfer.set(true);
    const branchId: string = this.transferForm.value.branchId;
    const selected = this.availableBranches().find((b) => b.id === branchId);
    this.bootstrapService.transferMatriz(branchId).subscribe({
      next: (res: any) => {
        this.isLoadingTransfer.set(false);
        this.transferredFromId.set(res?.oldId ?? null);
        this.transferredToId.set(res?.id ?? branchId);
        this.transferredToName.set(res?.name ?? selected?.name ?? null);
        this.currentStep.set('transfer-done');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingTransfer.set(false);
        const code = err?.error?.code;
        if (code === 'BRANCH.ALREADY_MATRIZ') {
          this.transferError.set('Esa sucursal ya es la matriz activa.');
        } else if (code === 'BRANCH.NOT_FOUND') {
          this.transferError.set('La sucursal seleccionada ya no existe.');
        } else if (code === 'AUTH.PERMISSION_DENIED') {
          this.transferError.set('No tienes permisos para transferir la matriz.');
        } else {
          this.transferError.set(
            err?.error?.message ||
              'Error al transferir la matriz. Intente nuevamente.',
          );
        }
        this.cdr.detectChanges();
      },
    });
  }

  /** Cierra la sesion del admin para que el siguiente login sea como GG. */
  logoutAndRestartAsGg(): void {
    this.authService.logout();
  }

  /** Vuelve al dashboard despues de la transferencia. */
  backToDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}
