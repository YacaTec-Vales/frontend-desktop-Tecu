import { Directive, TemplateRef, ViewContainerRef, inject, OnInit } from '@angular/core';
import { VpnStatusService } from '../services/vpn-status.service';

/**
 * Directiva estructural `*vpnOnly` — renderiza el contenido solo si la
 * sesion del navegador esta siendo servida por el tunel WireGuard
 * (hostname `vpn.taquizaschavez.com.mx`).
 *
 * Uso:
 * ```html
 * <button *vpnOnly (click)="aprobar()">Aprobar</button>
 * ```
 *
 * En desarrollo (localhost) se considera "en VPN" para poder probar el
 * boton localmente.
 */
@Directive({
  selector: '[vpnOnly]',
  standalone: true,
})
export class VpnOnlyDirective implements OnInit {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly vpn = inject(VpnStatusService);

  ngOnInit(): void {
    if (this.vpn.isOnVpn()) {
      this.vcr.createEmbeddedView(this.tpl);
    }
  }
}
