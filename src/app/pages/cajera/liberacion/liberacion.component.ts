import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { VoucherService, VoucherDetails } from '../../../core/services/voucher.service';
import { DocumentService, DocumentResponse } from '../../../core/services/document.service';

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

  // Documentos del cliente (GET /api/v1/uploads/client/{clientId})
  clientDocs: DocumentResponse[] = [];
  isClientDocsLoading = false;

  // Modal Token (Disputa)
  isModalTokenOpen = false;
  tokenInput: string = '';
  modoEdicionActivo = false;

  constructor(
    private voucherService: VoucherService,
    private documentService: DocumentService,
    private cdr: ChangeDetectorRef
  ) {}

  buscarFolio() {
    const folioLimpio = this.folioBuscado.trim();
    if (!folioLimpio) {
      this.reset();
      return;
    }
    
    this.isLoading = true;
    this.errorBusqueda = '';
    this.valeEncontrado = null;
    this.liberacionExitosa = false;
    this.ineValidado = false;
    this.comprobanteValidado = false;
    this.autorizacionBancaria = '';

    this.voucherService.findVoucher(folioLimpio).subscribe({
      next: (vale) => {
        console.log('Vale encontrado procesado:', vale);
        this.isLoading = false;
        this.valeEncontrado = vale;
        // Cargar documentos del cliente si el voucher tiene clientId
        // GET /api/v1/uploads/client/{clientId}
        const clientId = (vale as any).clientId || (vale as any).client?.id;
        if (clientId) {
          this.loadClientDocs(clientId);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error en findVoucher:', err);
        this.isLoading = false;
        this.errorBusqueda = err.error?.message || err.message || 'Error al buscar el folio. Verifique e intente nuevamente.';
        this.cdr.detectChanges();
      }
    });
  }

  loadClientDocs(clientId: string) {
    this.isClientDocsLoading = true;
    this.documentService.getDocumentsByClient(clientId).subscribe({
      next: (docs) => {
        this.clientDocs = docs;
        this.isClientDocsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isClientDocsLoading = false;
        this.cdr.detectChanges();
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
      const payload = {
        authorizationNumber: this.autorizacionBancaria,
        dataConfirmed: true,
        documents: []
      };
      this.voucherService.confirmVoucher(this.valeEncontrado.folio, payload).subscribe({
        next: () => {
          this.isConfirming = false;
          this.liberacionExitosa = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isConfirming = false;
          alert('Error al confirmar pago: ' + (err.error?.message || err.message));
          this.cdr.detectChanges();
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

  reset() {
    this.folioBuscado = '';
    this.valeEncontrado = null;
    this.liberacionExitosa = false;
    this.errorBusqueda = '';
    this.ineValidado = false;
    this.comprobanteValidado = false;
    this.autorizacionBancaria = '';
    this.clientDocs = [];
    this.isClientDocsLoading = false;
  }
}
