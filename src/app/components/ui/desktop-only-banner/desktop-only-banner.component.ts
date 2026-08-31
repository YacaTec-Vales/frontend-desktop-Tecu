import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceDetectionService } from '../../../core/services/device-detection.service';

/**
 * Banner sticky que se muestra en TODA la app (excepto login) cuando
 * el usuario abre Tecu desde un dispositivo NO-desktop (tablet o mobile).
 *
 * Mensaje: "Esta aplicacion solo esta disponible en escritorio. Por
 * favor abrala desde una PC."
 *
 * BUG FIX 2026-08-31: esta validacion solo existia en el login. Ahora
 * se aplica a TODA la app via este componente que los layouts de cada
 * rol renderizan.
 *
 * Uso: <app-desktop-only-banner></app-desktop-only-banner> al inicio
 * de cada layout (admin, gerente-general, gerente-sucursal, cajera).
 */
@Component({
  selector: 'app-desktop-only-banner',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showBanner()) {
      <div
        role="alert"
        class="sticky top-0 z-50 w-full bg-amber-50 border-b-2 border-amber-400 px-4 py-3 text-amber-900 shadow-md"
        data-testid="desktop-only-banner"
      >
        <div class="flex items-center gap-3 max-w-7xl mx-auto">
          <svg class="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9.75 17L9 20l-1 1h8l-1-1-.25-3M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm6 2.25a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <div class="flex-1">
            <strong class="font-bold">Esta aplicacion solo esta disponible en escritorio.</strong>
            <span class="block sm:inline ml-2">Por favor abrala desde una PC para una mejor experiencia.</span>
          </div>
        </div>
      </div>
    }
  `,
})
export class DesktopOnlyBannerComponent {
  private readonly device = inject(DeviceDetectionService);

  /** Muestra el banner solo si NO es desktop y ya se determino el dispositivo. */
  showBanner(): boolean {
    return this.device.isDesktop() === false;
  }
}
