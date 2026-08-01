import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';

@Component({
  selector: 'app-liberacion',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, ButtonComponent, ModalComponent],
  templateUrl: './liberacion.component.html'
})
export class LiberacionComponent {
  folioBuscado: string = '';
  valeEncontrado: any = null;
  errorBusqueda: string = '';

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

  buscarFolio() {
    this.errorBusqueda = '';
    this.valeEncontrado = null;
    this.liberacionExitosa = false;
    this.ineValidado = false;
    this.comprobanteValidado = false;
    this.autorizacionBancaria = '';

    if (this.folioBuscado === 'PRE-123') {
      this.valeEncontrado = { tipo: 'Pre-Vale', cliente: 'Carlos Sánchez', monto: '$2,500.00', folio: 'PRE-123' };
    } else if (this.folioBuscado === 'DIG-456') {
      this.valeEncontrado = { tipo: 'Vale Digital', cliente: 'Ana Rodríguez', monto: '$4,000.00', folio: 'DIG-456' };
    } else {
      this.errorBusqueda = 'Folio no encontrado. Pruebe con PRE-123 o DIG-456.';
    }
  }

  puedeLiberar(): boolean {
    if (!this.valeEncontrado) return false;
    if (this.valeEncontrado.tipo === 'Pre-Vale') {
      return this.ineValidado && this.comprobanteValidado && this.autorizacionBancaria.length > 3;
    }
    return this.ineValidado && this.autorizacionBancaria.length > 3;
  }

  liberarPago() {
    if (this.puedeLiberar()) {
      this.liberacionExitosa = true;
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
