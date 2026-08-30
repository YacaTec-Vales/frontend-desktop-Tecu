import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CardComponent } from '../../../components/ui/card/card';
import { ButtonComponent } from '../../../components/ui/button/button';
import { BusinessConfigService } from '../../../core/services/business-config.service';
import { BusinessConfigItem } from '../../../core/models/business-config.model';

/**
 * Vista informativa de las reglas globales del negocio.
 *
 * Esta pagina NO es editable: la fuente canonica para editar tasas
 * globales es `Configuracion de Negocio` (que persiste via
 * `BusinessConfigService`). Aqui solo se muestra el estado actual
 * para consulta.
 *
 * Los dias de corte/pago NO son globales: se configuran POR sucursal
 * en `Sucursales -> Detalle -> Cortes`.
 */
@Component({
  selector: 'app-motor-reglas',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  templateUrl: './motor-reglas.component.html'
})
export class MotorReglasComponent implements OnInit {
  private readonly configService = inject(BusinessConfigService);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);
  readonly errorMessage = signal<string>('');
  readonly configItems = signal<BusinessConfigItem[]>([]);

  ngOnInit() {
    this.loadConfig();
  }

  loadConfig() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.configService.getConfig().subscribe({
      next: (data) => {
        this.configItems.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          'Error al cargar configuracion: ' + (err.error?.message || err.message),
        );
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Devuelve el valor en unidades amigables (pesos o porcentaje) segun
   * el `configKey`. Si no existe en la lista, devuelve null.
   */
  getValue(key: string): { display: string; numeric: number | null } {
    const item = this.configItems().find((i) => i.configKey === key);
    if (!item) return { display: 'No configurado', numeric: null };
    if (item.valueCents !== null && item.valueCents !== undefined) {
      const pesos = item.valueCents / 100;
      return {
        display: pesos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        numeric: pesos,
      };
    }
    if (item.valueBps !== null && item.valueBps !== undefined) {
      const percent = item.valueBps / 100;
      return {
        display: percent.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%',
        numeric: percent,
      };
    }
    return { display: 'No configurado', numeric: null };
  }

  /** Descripcion legible del configKey. */
  getDescription(key: string): string {
    const item = this.configItems().find((i) => i.configKey === key);
    return item?.description || '';
  }

  goToConfiguracion() {
    this.router.navigate(['/gerente-general/configuracion']);
  }
}
