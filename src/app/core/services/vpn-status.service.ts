import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Detecta si la sesion del navegador esta siendo servida a traves del
 * tunel WireGuard (hostname `vpn.taquizaschavez.com.mx`).
 *
 * Politica: las acciones sensibles (autorizar solicitudes, ejecutar
 * cortes, liberar pagos, aprobar aumento de credito, etc.) requieren
 * VPN en el backend (`@RequireVpnOrigin('Tecu')`). El frontend Tecu
 * oculta sus botones cuando el usuario no navega por VPN, evitando
 * errores 403 NOT_VPN_ORIGIN y dejando claro que la accion requiere
 * conexion por tunel.
 *
 * Solo aplica la comprobacion en PRODUCCION. En desarrollo
 * (`environment.production === false`) se considera siempre "en VPN"
 * para que el equipo pueda probar todos los flujos sin necesidad de
 * tunel VPN ni hostname canonico.
 */
@Injectable({ providedIn: 'root' })
export class VpnStatusService {
  private static readonly VPN_HOSTNAMES = new Set<string>([
    'vpn.taquizaschavez.com.mx',
  ]);

  isOnVpn(): boolean {
    if (!environment.production) return true;
    const host =
      typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
    return VpnStatusService.VPN_HOSTNAMES.has(host);
  }
}
