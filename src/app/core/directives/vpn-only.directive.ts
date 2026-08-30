import { Directive, TemplateRef, ViewContainerRef, effect, inject, OnInit } from '@angular/core';
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
 *
 * Re-evalua reactivamente si cambia el estado del servicio (poco
 * frecuente en SPA pero util para escenarios futuros).
 */
@Directive({
  selector: '[vpnOnly]',
})
export class VpnOnlyDirective implements OnInit {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly vpn = inject(VpnStatusService);
  private rendered = false;

  constructor() {
    effect(() => {
      const on = this.vpn.isOnVpn();
      if (on && !this.rendered) {
        this.vcr.createEmbeddedView(this.tpl);
        this.rendered = true;
      } else if (!on && this.rendered) {
        this.vcr.clear();
        this.rendered = false;
      }
    });
  }

  ngOnInit(): void {
    // Trigger inicial por si el effect no se ejecuta en SSR.
    if (this.vpn.isOnVpn() && !this.rendered) {
      this.vcr.createEmbeddedView(this.tpl);
      this.rendered = true;
    }
  }
}
