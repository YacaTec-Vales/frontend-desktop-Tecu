import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BranchService, ListBranchesFilters } from '../../../core/services/branch.service';
import { BootstrapService } from '../../../core/services/bootstrap.service';
import { AlertService } from '../../../core/services/alert.service';
import { AppValidators } from '../../../core/validators/app-validators';
import { OnlyLettersDirective } from '../../../core/directives/only-letters.directive';
import { UppercaseDirective } from '../../../core/directives/uppercase.directive';
import { sanitizePayload } from '../../../core/utils/sanitizer.util';
import type { Branch } from '../../../core/models/branch.model';

type View = 'list' | 'create';

/**
 * Gestion de sucursales para el ADMINISTRADOR.
 *
 * Tres acciones:
 *  - Listar todas las sucursales (MATRIZ resaltada).
 *  - Crear una nueva sucursal (SUCURSAL). El admin puede hacerlo
 *    porque tiene `branch.create.matriz` y el controller acepta
 *    cualquiera de las dos permissions (`branch.create` o
 *    `branch.create.matriz`).
 *  - Transferir la cualidad de MATRIZ a otra sucursal via
 *    `POST /branches/:id/transfer-matriz` (requiere
 *    `branch.transfer.matriz`).
 *
 * El sistema exige exactamente una MATRIZ. No existe un endpoint
 * para "remover la MATRIZ sin reasignarla" (backend responde
 * `BRANCH.CANNOT_REMOVE_MATRIZ` al soft-delete de la MATRIZ).
 */
@Component({
  selector: 'app-admin-sucursales',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OnlyLettersDirective,
    UppercaseDirective,
  ],
  templateUrl: './sucursales.component.html',
})
export class SucursalesAdminComponent implements OnInit {
  private branchService = inject(BranchService);
  private bootstrapService = inject(BootstrapService);
  private alert = inject(AlertService);
  private fb = inject(FormBuilder);

  readonly view = signal<View>('list');
  readonly branches = signal<Branch[]>([]);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly matriz = computed(() => this.branches().find((b) => b.esMatriz) ?? null);
  readonly otras = computed(() => this.branches().filter((b) => !b.esMatriz));

  readonly createForm: FormGroup = this.fb.group(
    {
      name: ['', [Validators.required, AppValidators.branchName()]],
      folioPrefix: ['', [Validators.required, AppValidators.folioPrefix()]],
      address: ['', [Validators.maxLength(255)]],
      cutoffDay: [15, [Validators.required, Validators.min(1), Validators.max(31)]],
      paymentDay: [20, [Validators.required, Validators.min(1), Validators.max(31)]],
    },
    { validators: AppValidators.paymentDayAfterCutoff(5) },
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.branchService
      .listBranches({ page: 1, limit: 100 })
      .subscribe({
        next: (res) => {
          this.branches.set(res.data ?? []);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.error.set(
            err?.error?.message ||
              'No se pudieron cargar las sucursales.',
          );
        },
      });
  }

  goCreate(): void {
    this.createForm.reset({
      name: '',
      folioPrefix: '',
      address: '',
      cutoffDay: 15,
      paymentDay: 20,
    });
    this.view.set('create');
  }

  goList(): void {
    this.view.set('list');
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    const raw = this.createForm.value as {
      name: string;
      folioPrefix: string;
      address?: string;
      cutoffDay: number;
      paymentDay: number;
    };
    const payload = sanitizePayload({
      name: raw.name,
      folioPrefix: raw.folioPrefix.toUpperCase(),
      branchType: 'SUCURSAL' as const,
      esMatriz: false,
      cutoffDay: Number(raw.cutoffDay),
      paymentDay: Number(raw.paymentDay),
      ...(raw.address && raw.address.trim() ? { address: raw.address.trim() } : {}),
    });
    this.branchService.createBranch(payload as never).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.alert.success('Sucursal creada correctamente.');
        this.view.set('list');
        this.load();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const code = err?.error?.code;
        if (code === 'BRANCH.FOLIO_PREFIX_EXISTS') {
          this.alert.error('Ese prefijo de folio ya esta en uso.');
        } else if (code === 'AUTH.INSUFFICIENT_PERMISSIONS' || code === 'AUTH.PERMISSION_DENIED') {
          this.alert.error('No tienes permisos para crear sucursales.');
        } else {
          this.alert.error(
            err?.error?.message || 'Error al crear la sucursal.',
          );
        }
      },
    });
  }

  transferTo(b: Branch): void {
    const ok = confirm(
      `Vas a transferir la cualidad de MATRIZ a "${b.name}". La matriz actual dejara de serlo y perdera su gerente. Esta operacion es irreversible desde la UI.\n\nContinuar?`,
    );
    if (!ok) return;
    this.bootstrapService.transferMatriz(b.id).subscribe({
      next: () => {
        this.alert.success(`MATRIZ transferida a ${b.name}.`);
        this.load();
        this.bootstrapService.refreshStatus().subscribe();
      },
      error: (err) => {
        const code = err?.error?.code;
        if (code === 'BRANCH.ALREADY_MATRIZ') {
          this.alert.error('Esa sucursal ya es la matriz activa.');
        } else if (code === 'BRANCH.TRANSFER_FORBIDDEN' || code === 'AUTH.INSUFFICIENT_PERMISSIONS' || code === 'AUTH.PERMISSION_DENIED') {
          this.alert.error(
            'No tienes permisos para transferir la matriz. Ejecuta en backend: `npm run seed:branch-permissions`.',
          );
        } else {
          this.alert.error(
            err?.error?.message || 'Error al transferir la matriz.',
          );
        }
      },
    });
  }

  trackById(_i: number, b: Branch): string {
    return b.id;
  }
}
