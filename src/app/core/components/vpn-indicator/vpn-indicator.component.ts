import { Component, computed, inject, signal } from '@angular/core';
import { VpnStatusService } from '../../services/vpn-status.service';

/**
 * Indicador visual del estado de la sesion VPN.
 *
 * Politica: las acciones sensibles en backend requieren VPN
 * (`@RequireVpnOrigin('Tecu')` en 18 endpoints). El backend responde
 * 403 NOT_VPN_ORIGIN cuando el usuario Tecu intenta ejecutarlas
 * fuera del tunel.
 *
 * Este componente muestra un badge en la esquina superior derecha:
 *  - VERDE  + texto "VPN"   : dentro del tunel (todo operativo).
 *  - ROJO   + texto "NO VPN": fuera del tunel (acciones sensibles
 *    quedaran deshabilitadas / fallaran).
 *
 * En desarrollo (`environment.production === false`) siempre verde
 * para que el equipo pueda probar sin tunel.
 *
 * Solo se muestra en layouts de Tecu (admin, gerente-general,
 * gerente-sucursal). La cajera no lo ve.
 */
@Component({
  selector: 'app-vpn-indicator',
  imports: [],
  templateUrl: './vpn-indicator.component.html',
})
export class VpnIndicatorComponent {
  private readonly vpnStatus = inject(VpnStatusService);

  readonly isOnVpn = signal<boolean>(this.vpnStatus.isOnVpn());

  readonly statusText = computed(() =>
    this.isOnVpn() ? 'VPN' : 'NO VPN',
  );

  readonly tooltip = computed(() =>
    this.isOnVpn()
      ? 'Conectado a traves del tunel VPN. Acciones sensibles habilitadas.'
      : 'Fuera del tunel VPN. Acciones sensibles (autorizar, cortes, pagos) quedaran deshabilitadas.',
  );

  readonly cssClass = computed(() =>
    this.isOnVpn()
      ? 'bg-emerald-500 text-white border-emerald-600'
      : 'bg-red-500 text-white border-red-600',
  );

  readonly dotClass = computed(() =>
    this.isOnVpn() ? 'bg-white animate-pulse' : 'bg-white',
  );
}
