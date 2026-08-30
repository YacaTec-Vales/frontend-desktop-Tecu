import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VpnStatusService } from '../../../core/services/vpn-status.service';

/**
 * Banner persistente que aparece debajo del header cuando la sesion
 * NO esta siendo servida a traves del tunel WireGuard
 * (`vpn.taquizaschavez.com.mx`).
 *
 * Es redundancia accesible del `<app-vpn-indicator>` (que es solo un
 * badge): el indicator avisa, el banner explica el motivo y que las
 * acciones sensibles quedaran deshabilitadas.
 *
 * Solo se muestra en layouts donde existen acciones mutantes
 * (admin, gerente-general, gerente-sucursal, cajera). El login NO lo
 * usa: si el usuario esta en login, no hay sesion todavia.
 *
 * El texto orienta al usuario al hostname correcto para entrar por
 * la VPN (politica Zero Trust de la plataforma).
 */
@Component({
  selector: 'app-vpn-readonly-banner',
  imports: [CommonModule],
  templateUrl: './vpn-readonly-banner.component.html',
})
export class VpnReadonlyBannerComponent {
  private readonly vpnStatus = inject(VpnStatusService);

  readonly visible = computed(() => this.vpnStatus.isOffVpn());
}
