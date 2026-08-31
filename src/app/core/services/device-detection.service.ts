import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Servicio de deteccion de tipo de dispositivo para Tecu.
 *
 * Tecu es exclusivo de escritorio (no soporta tablet ni mobile).
 * Si el usuario abre Tecu en un dispositivo no-desktop, mostramos un
 * banner sticky en toda la app pidiendo que use un escritorio.
 *
 * BUG FIX 2026-08-31: esta validacion solo funcionaba en el login
 * (via auth.interceptor.ts que enviaba x-client-app=Tecu siempre).
 * Ahora se aplica a TODA la app via este service + DesktopOnlyBanner.
 *
 * Deteccion:
 *  - userAgentData.mobile (Chrome/Edge modernos).
 *  - navigator.userAgent regex (Safari, Firefox fallback).
 *  - window.innerWidth como fallback final.
 */
@Injectable({ providedIn: 'root' })
export class DeviceDetectionService {
  private readonly platformId = inject(PLATFORM_ID);

  /** null = desconocido (server-side render), true/false = mobile o no. */
  private readonly _isMobile = signal<boolean | null>(null);

  /** true si NO es desktop (mobile o tablet). null = desconocido. */
  readonly isMobileOrTablet = computed(() => {
    const m = this._isMobile();
    return m === null ? null : m;
  });

  /** true si es desktop con certeza. null = desconocido. */
  readonly isDesktop = computed(() => {
    const m = this._isMobile();
    return m === null ? null : !m;
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.detect();
    }
  }

  /**
   * Ejecuta la deteccion del dispositivo via userAgentData (preferido)
   * o userAgent (fallback). Se ejecuta una sola vez en el constructor.
   */
  private detect(): void {
    // 1) Preferir navigator.userAgentData (Chrome/Edge modernos).
    const uaData = (navigator as unknown as { userAgentData?: { mobile?: boolean } })
      .userAgentData;
    if (uaData && typeof uaData.mobile === 'boolean') {
      this._isMobile.set(uaData.mobile);
      return;
    }

    // 2) Fallback: regex en userAgent.
    const ua = (navigator.userAgent || '').toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/.test(ua);
    this._isMobile.set(isMobileUA);
  }

  /** Para uso en componentes standalone (no esperan signals). */
  checkIsMobile(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    if (this._isMobile() !== null) return this._isMobile() as boolean;
    this.detect();
    return this._isMobile() as boolean;
  }
}
