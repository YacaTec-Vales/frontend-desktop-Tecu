import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { ButtonComponent } from '../../../components/ui/button/button';
import { InputComponent } from '../../../components/ui/input/input';
import { BadgeComponent } from '../../../components/ui/badge/badge';
import { RelationService, RelationDetails, PaymentWindow } from '../../../core/services/relation.service';

@Component({
  selector: 'app-conciliacion',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, ButtonComponent, InputComponent, BadgeComponent],
  templateUrl: './conciliacion.component.html'
})
export class ConciliacionComponent {
  relationIdBuscado: string = '';
  relationEncontrada: RelationDetails | null = null;
  paymentWindow: PaymentWindow | null = null;
  
  isLoadingBusqueda = false;
  errorBusqueda = '';

  isPaying = false;
  referenciaPago: string = '';
  pagoExitoso = false;
  
  constructor(private relationService: RelationService) {}

  buscarRelacion() {
    if (!this.relationIdBuscado) return;
    
    this.isLoadingBusqueda = true;
    this.errorBusqueda = '';
    this.relationEncontrada = null;
    this.paymentWindow = null;
    this.pagoExitoso = false;
    this.referenciaPago = '';

    this.relationService.getRelation(this.relationIdBuscado).subscribe({
      next: (rel) => {
        this.relationEncontrada = rel;
        // Cargar ventana de pago también
        this.relationService.getPaymentWindow(rel.relationId).subscribe({
          next: (window) => {
            this.paymentWindow = window;
            this.isLoadingBusqueda = false;
          },
          error: (err) => {
            this.isLoadingBusqueda = false;
            // Aún si falla la ventana, mostramos la relación
            console.error('Error al cargar payment window', err);
          }
        });
      },
      error: (err) => {
        this.isLoadingBusqueda = false;
        this.errorBusqueda = err.error?.message || 'No se encontró la Relación. Verifique el UUID.';
      }
    });
  }

  aplicarPago() {
    if (!this.relationEncontrada) return;

    // TODO: En el futuro podría haber cobros parciales. 
    // Por ahora la cajera cobra el totalToPayCents.
    const montoACobrarCents = this.relationEncontrada.totalToPayCents;

    this.isPaying = true;
    this.relationService.payRelation(this.relationEncontrada.relationId, montoACobrarCents, this.referenciaPago).subscribe({
      next: () => {
        this.isPaying = false;
        this.pagoExitoso = true;
        if (this.relationEncontrada) {
          this.relationEncontrada.paymentStatus = 'PAID';
        }
      },
      error: (err) => {
        this.isPaying = false;
        alert('Error al procesar el pago: ' + (err.error?.message || err.message));
      }
    });
  }
}
