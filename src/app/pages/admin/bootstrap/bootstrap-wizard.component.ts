import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BootstrapService, BootstrapStatus } from '../../../core/services/bootstrap.service';
import { AuthService } from '../../../core/services/auth.service';
import { BranchService } from '../../../core/services/branch.service';
import { AlertService } from '../../../core/services/alert.service';
import { AppValidators } from '../../../core/validators/app-validators';
import { OnlyDigitsDirective } from '../../../core/directives/only-digits.directive';
import { OnlyLettersDirective } from '../../../core/directives/only-letters.directive';
import { UppercaseDirective } from '../../../core/directives/uppercase.directive';
import { LowercaseDirective } from '../../../core/directives/lowercase.directive';
import { sanitizePayload } from '../../../core/utils/sanitizer.util';
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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OnlyDigitsDirective,
    OnlyLettersDirective,
    UppercaseDirective,
    LowercaseDirective,
  ],
  templateUrl: './bootstrap-wizard.component.html',
})
export class BootstrapWizardComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bootstrapService = inject(BootstrapService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private branchService = inject(BranchService);
  private alert = inject(AlertService);

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
  matrizForm: FormGroup = this.fb.group(
    {
      name: ['', [Validators.required, AppValidators.branchName()]],
      folioPrefix: ['', [Validators.required, AppValidators.folioPrefix()]],
      address: ['', [Validators.maxLength(255)]],
      cutoffDay: [15, [Validators.required, Validators.min(1), Validators.max(31)]],
      paymentDay: [20, [Validators.required, Validators.min(1), Validators.max(31)]],
    },
    { validators: AppValidators.paymentDayAfterCutoff(5) },
  );

  ggForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, AppValidators.personName()]],
    lastNamePaternal: ['', [Validators.required, AppValidators.personName()]],
    lastNameMaternal: ['', [Validators.required, AppValidators.personName()]],
    email: ['', [Validators.required, Validators.email, AppValidators.emailMax255()]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), AppValidators.usernameSlug()]],
    phone: ['', [AppValidators.phoneMx()]],
  });

  transferForm: FormGroup = this.fb.group({
    branchId: ['', [Validators.required]],
    confirm: [false, [Validators.requiredTrue]],
  });

  /** Numero del paso actual (1..N) para mostrar progreso. */
  readonly stepNumber = (): number => {
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
  };

  totalSteps(): number {
    return this.mode() === 'transfer' ? 2 : 3;
  }

  ngOnInit(): void {
    const requestedMode = this.route.snapshot.queryParamMap.get('mode');
    if (requestedMode === 'transfer-matriz') {
      this.mode.set('transfer');
      this.currentStep.set('transfer-matriz');
      void this.loadBranches();
      return;
    }
    // Modo creacion: redirigir al dashboard si ya esta inicializado.
    this.bootstrapService.refreshStatus().subscribe({
      next: (s) => {
        if (s.bootstrapComplete) {
          this.router.navigate(['/admin/dashboard']);
        } else if (s.matrizId) {
          this.matrizId.set(s.matrizId);
          this.matrizName.set(s.matrizName ?? null);
          this.currentStep.set('gerente-general');
        }
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
      },
      error: () => {
        this.isLoadingBranches.set(false);
        this.transferError.set('No se pudieron cargar las sucursales.');
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
    const raw = this.matrizForm.value as {
      name: string;
      folioPrefix: string;
      address?: string;
      cutoffDay: number;
      paymentDay: number;
    };
    const payload = sanitizePayload({
      name: raw.name,
      folioPrefix: raw.folioPrefix.toUpperCase(),
      branchType: 'MATRIZ' as const,
      esMatriz: true as const,
      cutoffDay: Number(raw.cutoffDay),
      paymentDay: Number(raw.paymentDay),
      ...(raw.address && raw.address.trim() ? { address: raw.address.trim() } : {}),
    });
    this.bootstrapService.createMatriz(payload).subscribe({
      next: (res: any) => {
        this.isLoadingMatriz.set(false);
        this.matrizId.set(res?.id ?? res?.data?.id ?? null);
        this.matrizName.set(res?.name ?? res?.data?.name ?? raw.name);
        this.currentStep.set('gerente-general');
      },
      error: (err) => {
        this.isLoadingMatriz.set(false);
        const code = err?.error?.code;
        if (code === 'BRANCH.MATRIZ_ALREADY_EXISTS') {
          this.matrizError.set(
            'Ya existe una MATRIZ activa. El sistema rechaza una segunda. Refresca la pagina.',
          );
        } else if (code === 'BRANCH.FOLIO_PREFIX_EXISTS') {
          this.matrizError.set('Ese prefijo de folio ya esta en uso. Elige otro.');
        } else {
          this.matrizError.set(
            err?.error?.message ||
              'Error al crear la sucursal MATRIZ. Intente nuevamente.',
          );
        }
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
    const raw = this.ggForm.value as {
      firstName: string;
      lastNamePaternal: string;
      lastNameMaternal: string;
      email: string;
      username: string;
      phone?: string;
    };
    const payload = sanitizePayload({
      firstName: raw.firstName,
      lastNamePaternal: raw.lastNamePaternal,
      lastNameMaternal: raw.lastNameMaternal,
      email: raw.email.toLowerCase(),
      username: raw.username.toLowerCase(),
      ...(raw.phone ? { phone: raw.phone } : {}),
    });
    this.bootstrapService.createGerenteGeneral(payload).subscribe({
      next: (res: any) => {
        this.isLoadingGg.set(false);
        const id = res?.user?.id ?? res?.id ?? res?.data?.id ?? null;
        this.generalManagerId.set(id);
        this.generalManagerEmail.set(raw.email);
        // Refresca el estado global antes de mostrar "done" para que
        // el dashboard salga como Operativo si el usuario vuelve.
        this.bootstrapService.refreshStatus().subscribe({
          next: () => this.currentStep.set('done'),
          error: () => this.currentStep.set('done'),
        });
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
        const data = res?.data ?? res;
        this.transferredToId.set(data?.id ?? branchId);
        this.transferredToName.set(data?.name ?? selected?.name ?? null);
        this.transferredFromId.set(data?.oldId ?? null);
        this.currentStep.set('transfer-done');
        // Refresca el estado global para que el dashboard muestre la
        // nueva matriz al volver.
        this.bootstrapService.refreshStatus().subscribe();
      },
      error: (err) => {
        this.isLoadingTransfer.set(false);
        const code = err?.error?.code;
        if (code === 'BRANCH.ALREADY_MATRIZ') {
          this.transferError.set('Esa sucursal ya es la matriz activa.');
        } else if (code === 'BRANCH.NOT_FOUND') {
          this.transferError.set('La sucursal seleccionada ya no existe.');
        } else if (code === 'BRANCH.TRANSFER_FORBIDDEN' || code === 'AUTH.PERMISSION_DENIED' || code === 'AUTH.INSUFFICIENT_PERMISSIONS') {
          this.transferError.set(
            'No tienes permisos para transferir la matriz. El permiso `branch.transfer.matriz` debe asignarse en backend (`npm run seed:branch-permissions`).',
          );
        } else {
          this.transferError.set(
            err?.error?.message ||
              'Error al transferir la matriz. Intente nuevamente.',
          );
        }
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
