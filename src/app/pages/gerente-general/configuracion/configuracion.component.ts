import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';
import { VpnOnlyDirective } from '../../../core/directives/vpn-only.directive';
import { BusinessConfigService } from '../../../core/services/business-config.service';
import { BusinessConfigItem, BusinessConfigPatchDto, BusinessConfigPatchItem } from '../../../core/models/business-config.model';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, ButtonComponent, VpnOnlyDirective],
  templateUrl: './configuracion.component.html'
})
export class ConfiguracionComponent implements OnInit {
  isSaving = false;
  isLoading = true;
  successMessage = '';
  errorMessage = '';

  // Form model fields (in user-friendly units: pesos and percentages)
  insurancePesos: number | null = null;
  interestPercent: number | null = null;
  latePenaltyPesos: number | null = null;
  pointsDivisorPesos: number | null = null;
  pointsMultiplierPercent: number | null = null;
  pointsValuePesos: number | null = null;
  pointsLatePenaltyPercent: number | null = null;

  private originalConfig: BusinessConfigItem[] = [];

  constructor(private configService: BusinessConfigService) {}

  ngOnInit() {
    this.loadConfig();
  }

  loadConfig() {
    this.isLoading = true;
    this.configService.getConfig().subscribe({
      next: (data) => {
        this.originalConfig = data;
        this.mapDataToForm(data);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Error al cargar configuración: ' + (err.error?.message || err.message);
        this.isLoading = false;
      }
    });
  }

  private mapDataToForm(data: BusinessConfigItem[]) {
    data.forEach(item => {
      switch (item.configKey) {
        case 'insurance_cents':
          this.insurancePesos = item.valueCents ? item.valueCents / 100 : 0;
          break;
        case 'interest_per_period_bps':
          this.interestPercent = item.valueBps ? item.valueBps / 100 : 0;
          break;
        case 'late_penalty_cents':
          this.latePenaltyPesos = item.valueCents ? item.valueCents / 100 : 0;
          break;
        case 'points_divisor_cents':
          this.pointsDivisorPesos = item.valueCents ? item.valueCents / 100 : 0;
          break;
        case 'points_multiplier_bps':
          this.pointsMultiplierPercent = item.valueBps ? item.valueBps / 100 : 0;
          break;
        case 'points_value_cents':
          this.pointsValuePesos = item.valueCents ? item.valueCents / 100 : 0;
          break;
        case 'points_late_penalty_bps':
          this.pointsLatePenaltyPercent = item.valueBps ? item.valueBps / 100 : 0;
          break;
      }
    });
  }

  guardarConfiguracion() {
    this.errorMessage = '';

    // Validacion cliente: campos numericos >= 0 y finitos.
    const campos: Array<{ name: string; value: number | null; max?: number }> = [
      { name: 'Seguro (MXN)', value: this.insurancePesos, max: 1_000_000 },
      { name: 'Interes por periodo (%)', value: this.interestPercent, max: 100 },
      { name: 'Multa por atraso (MXN)', value: this.latePenaltyPesos, max: 1_000_000 },
      { name: 'Divisor de puntos (MXN)', value: this.pointsDivisorPesos, max: 1_000_000 },
      { name: 'Multiplicador de puntos (%)', value: this.pointsMultiplierPercent, max: 1000 },
      { name: 'Valor por punto (MXN)', value: this.pointsValuePesos, max: 1_000_000 },
      { name: 'Multa por atraso de puntos (%)', value: this.pointsLatePenaltyPercent, max: 100 },
    ];

    for (const c of campos) {
      if (c.value === null || !Number.isFinite(c.value) || c.value < 0) {
        this.errorMessage = `El campo "${c.name}" debe ser un numero valido mayor o igual a 0.`;
        return;
      }
      if (c.max !== undefined && c.value > c.max) {
        this.errorMessage = `El campo "${c.name}" no puede ser mayor a ${c.max.toLocaleString('es-MX')}.`;
        return;
      }
    }

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    const changes: BusinessConfigPatchItem[] = [];

    // Map back to cents and bps
    if (this.insurancePesos !== null) changes.push({ configKey: 'insurance_cents', valueCents: Math.round(this.insurancePesos * 100) });
    if (this.interestPercent !== null) changes.push({ configKey: 'interest_per_period_bps', valueBps: Math.round(this.interestPercent * 100) });
    if (this.latePenaltyPesos !== null) changes.push({ configKey: 'late_penalty_cents', valueCents: Math.round(this.latePenaltyPesos * 100) });
    if (this.pointsDivisorPesos !== null) changes.push({ configKey: 'points_divisor_cents', valueCents: Math.round(this.pointsDivisorPesos * 100) });
    if (this.pointsMultiplierPercent !== null) changes.push({ configKey: 'points_multiplier_bps', valueBps: Math.round(this.pointsMultiplierPercent * 100) });
    if (this.pointsValuePesos !== null) changes.push({ configKey: 'points_value_cents', valueCents: Math.round(this.pointsValuePesos * 100) });
    if (this.pointsLatePenaltyPercent !== null) changes.push({ configKey: 'points_late_penalty_bps', valueBps: Math.round(this.pointsLatePenaltyPercent * 100) });

    const dto: BusinessConfigPatchDto = { changes };

    this.configService.updateConfig(dto).subscribe({
      next: (updatedData) => {
        this.isSaving = false;
        this.originalConfig = updatedData;
        this.mapDataToForm(updatedData);
        this.successMessage = 'Configuración actualizada correctamente.';
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err) => {
        this.isSaving = false;
        this.errorMessage = 'Error al guardar: ' + (err.error?.message || err.message);
      }
    });
  }
}
