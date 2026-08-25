import { Component, OnInit, inject, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BootstrapService } from '../../../core/services/bootstrap.service';
import { AuthService } from '../../../core/services/auth.service';

type Step = 'matriz' | 'gerente-general' | 'done';

/**
 * Wizard de bootstrap inicial del sistema.
 *
 * Solo el ADMINISTRADOR llega aqui (ruta `/admin/bootstrap` protegida por
 * `roleGuard(['ADMINISTRADOR'])`). El wizard tiene 2 pasos porque el admin
 * es el unico con los permisos `branch.create.matriz` y
 * `user.create.general_manager` (los demas roles no pueden crear ni MATRIZ
 * ni GG por API).
 *
 * Flujo:
 *   1. Step 1: crea la sucursal MATRIZ.
 *   2. Step 2: crea al unico Gerente General (branchId=null enforced).
 *   3. Step 3: resumen + CTA "Cerrar sesion e iniciar como GG".
 *
 * Si el sistema ya fue inicializado por otro admin, el wizard se autoredirige
 * al dashboard al detectar `hasGeneralManager`.
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
  private cdr = inject(ChangeDetectorRef);

  /** Paso actual del wizard. */
  currentStep = signal<Step>('matriz');
  /** IDs devueltos por backend para el resumen final. */
  matrizId = signal<string | null>(null);
  generalManagerId = signal<string | null>(null);
  generalManagerEmail = signal<string | null>(null);

  /** Errores por paso. */
  matrizError = signal<string | null>(null);
  ggError = signal<string | null>(null);
  /** Loading por paso. */
  isLoadingMatriz = signal(false);
  isLoadingGg = signal(false);

  /** Forms reactivos con validaciones alineadas al backend. */
  matrizForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    folioPrefix: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]],
    address: [''],
    cutoffDay: [15, [Validators.min(1), Validators.max(31)]],
    paymentDay: [20, [Validators.min(1), Validators.max(31)]],
    earlyPaymentDays: [3, [Validators.min(0), Validators.max(31)]],
  });

  ggForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    lastNamePaternal: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    lastNameMaternal: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    phone: [''],
  });

  /** Numero del paso actual (1, 2 o 3) para mostrar progreso. */
  readonly stepNumber = computed(() => {
    switch (this.currentStep()) {
      case 'matriz':
        return 1;
      case 'gerente-general':
        return 2;
      case 'done':
        return 3;
    }
  });

  ngOnInit(): void {
    // Si el sistema ya esta inicializado, redirigir al dashboard.
    this.bootstrapService.getSystemStatus().subscribe({
      next: (s) => {
        if (s.bootstrapComplete) {
          this.router.navigate(['/admin/dashboard']);
        } else if (s.matrizId) {
          this.matrizId.set(s.matrizId);
          // Si solo existe la matriz, salta al step 2.
          this.currentStep.set('gerente-general');
        }
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

  /** Cierra la sesion del admin para que el siguiente login sea como GG. */
  logoutAndRestartAsGg(): void {
    this.authService.logout();
  }
}
