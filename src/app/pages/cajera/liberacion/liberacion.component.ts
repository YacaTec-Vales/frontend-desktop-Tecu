import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { VoucherService, VoucherDetails } from '../../../core/services/voucher.service';

@Component({
  selector: 'app-liberacion',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, ButtonComponent, ModalComponent],
  templateUrl: './liberacion.component.html'
})
export class LiberacionComponent {
  folioBuscado: string = '';
  valeEncontrado: VoucherDetails | null = null;
  errorBusqueda: string = '';
  isLoading: boolean = false;
  isConfirming: boolean = false;

  // Controles de cotejo
  ineValidado: boolean = false;
  comprobanteValidado: boolean = false;
  
  // Flujo Final
  autorizacionBancaria: string = '';
  liberacionExitosa: boolean = false;

  // Modal Token (Disputa)
  isModalTokenOpen = false;
  tokenInput: string = '';
  modoEdicionActivo = false;

  constructor(private voucherService: VoucherService) {}

  buscarFolio() {
    if (!this.folioBuscado) return;
    
    this.isLoading = true;
    this.errorBusqueda = '';
    this.valeEncontrado = null;
    this.liberacionExitosa = false;
    this.ineValidado = false;
    this.comprobanteValidado = false;
    this.autorizacionBancaria = '';

    this.voucherService.findVoucher(this.folioBuscado).subscribe({
      next: (vale) => {
        this.isLoading = false;
        this.valeEncontrado = vale;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorBusqueda = err.error?.message || 'Error al buscar el folio. Verifique e intente nuevamente.';
      }
    });
  }

  puedeLiberar(): boolean {
    if (!this.valeEncontrado) return false;
    if (this.valeEncontrado.tipo === 'Pre-Vale') {
      return this.ineValidado && this.comprobanteValidado && this.autorizacionBancaria.length > 3;
    }
    return this.ineValidado && this.autorizacionBancaria.length > 3;
  }

  liberarPago() {
    if (this.puedeLiberar() && this.valeEncontrado) {
      this.isConfirming = true;
      this.voucherService.confirmVoucher(this.valeEncontrado.folio).subscribe({
        next: () => {
          this.isConfirming = false;
          this.liberacionExitosa = true;
        },
        error: (err) => {
          this.isConfirming = false;
          alert('Error al confirmar pago: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  abrirDisputa() {
    this.isModalTokenOpen = true;
    this.tokenInput = '';
  }

  cerrarDisputa() {
    this.isModalTokenOpen = false;
  }

  validarToken() {
    if (this.tokenInput.length === 6) {
      this.modoEdicionActivo = true;
      this.cerrarDisputa();
    } else {
      alert('Token inválido. Solicite el token de 6 dígitos al Gerente.');
    }
  }

  guardarEdicion() {
    this.modoEdicionActivo = false;
  }
}
