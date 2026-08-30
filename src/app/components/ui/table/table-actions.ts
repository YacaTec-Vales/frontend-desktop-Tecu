import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button';
import { VpnStatusService } from '../../../core/services/vpn-status.service';

/**
 * Botones de accion inline para las filas de `<app-table>`.
 *
 * Por politica, las acciones de edicion y desactivacion requieren
 * VPN (`@RequireVpnOrigin('Tecu')` en backend). Cuando el usuario
 * navega fuera del tunel, el componente no renderiza los botones,
 * dejando la fila visible pero no accionable.
 *
 * En desarrollo (`!environment.production`) siempre muestra los
 * botones para que el equipo pueda probar sin tunel.
 */
@Component({
  selector: 'app-table-actions',
  imports: [CommonModule, ButtonComponent],
  template: `
    @if (vpnEnabled()) {
      <div class="flex gap-2">
        @if (showEdit) {
          <app-button variant="warning" size="sm" title="Editar" data-action="edit" [attr.data-id]="id">
            <svg class="w-4 h-4 pointer-events-none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.779 17.779 4.36 19.918 6.5 13.5m4.279 4.279 8.364-8.643a3.027 3.027 0 0 0-2.14-5.165 3.03 3.03 0 0 0-2.14.886L6.5 13.5m4.279 4.279L6.499 13.5m2.14 2.14 6.213-6.504M12.75 7.04 17 11.28"/>
            </svg>
          </app-button>
        }
        @if (showDeactivate) {
          <app-button variant="error" size="sm" [title]="deactivateTitle" data-action="deactivate" [attr.data-id]="id">
            <svg class="w-4 h-4 pointer-events-none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/>
            </svg>
          </app-button>
        }
      </div>
    } @else {
      <span
        class="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-500"
        title="Acciones deshabilitadas: navega por VPN para habilitarlas"
      >
        VPN requerido
      </span>
    }
  `,
})
export class TableActionsComponent {
  private readonly vpnStatus = inject(VpnStatusService);

  @Input({ required: true }) id!: string;
  @Input() showEdit = true;
  @Input() showDeactivate = true;
  @Input() deactivateTitle = 'Desactivar';

  readonly vpnEnabled = computed(() => this.vpnStatus.isOnVpn());
}
