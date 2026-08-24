import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CardComponent } from '../../../components/ui/card/card';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { VpnOnlyDirective } from '../../../core/directives/vpn-only.directive';
import { SafeUrlPipe } from '../../../core/pipes/safe-url.pipe';
import { VoucherService, VoucherDetails } from '../../../core/services/voucher.service';
import { DocumentService, DocumentResponse } from '../../../core/services/document.service';

@Component({
  selector: 'app-liberacion',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, ButtonComponent, ModalComponent, VpnOnlyDirective, SafeUrlPipe],
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

  // Modal Inconsistencia
  isModalDiscrepancyOpen = false;
  isSubmittingDiscrepancy = false;
  discrepancyData = {
    description: '',
    fullName: '',
    curp: '',
    banco: '',
    clabe: ''
  };
  discrepancyFiles: File[] = [];
  discrepancyPreviews: string[] = [];
  discrepancyError: string = '';
  discrepancySuccess: string = '';

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
        
        // Auto-fill account number for Digital vouchers
        if (vale.tipo !== 'Pre-Vale' && vale.bankAccount?.clabe) {
          this.autorizacionBancaria = vale.bankAccount.clabe;
        }

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
      return this.ineValidado && this.comprobanteValidado;
    }
    return this.ineValidado && this.autorizacionBancaria.length > 3;
  }

  liberarPago() {
    if (this.puedeLiberar() && this.valeEncontrado) {
      this.isConfirming = true;
      const payload = {
        authorizationNumber: this.valeEncontrado.tipo === 'Pre-Vale' ? 'EFECTIVO' : this.autorizacionBancaria,
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

  abrirModalInconsistencia() {
    this.isModalDiscrepancyOpen = true;
    const clientData = this.valeEncontrado?.clientData || {};
    
    this.discrepancyData = {
      description: '',
      fullName: clientData.fullName || '',
      curp: clientData.curp || '',
      banco: clientData.bankAccount?.banco || '',
      clabe: clientData.bankAccount?.clabe || ''
    };
    this.discrepancyFiles = [];
  }

  cerrarModalInconsistencia() {
    this.isModalDiscrepancyOpen = false;
    this.clearPreviews();
  }

  clearPreviews() {
    this.discrepancyPreviews.forEach(url => URL.revokeObjectURL(url));
    this.discrepancyPreviews = [];
  }

  generatePreviews() {
    this.clearPreviews();
    this.discrepancyFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        this.discrepancyPreviews.push(URL.createObjectURL(file));
      }
    });
  }

  onFilesSelected(event: any) {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files) as File[];
      this.discrepancyFiles = [...this.discrepancyFiles, ...newFiles].slice(0, 3);
      this.generatePreviews();
    }
  }

  async submitDiscrepancy() {
    if (!this.valeEncontrado?.folio) return;
    
    this.isSubmittingDiscrepancy = true;
    this.discrepancyError = '';
    
    const payload = {
      discrepancyDescription: this.discrepancyData.description,
      discrepancyData: {
        fullName: this.discrepancyData.fullName.trim(),
        bankAccount: {
          banco: this.discrepancyData.banco,
          clabe: this.discrepancyData.clabe
        }
      }
    };

    try {
      // Subir las imágenes seleccionadas utilizando DocumentService
      for (const file of this.discrepancyFiles) {
        await firstValueFrom(this.documentService.uploadFile(
          file, 
          'voucher_evidence', 
          { folio: this.valeEncontrado.folio, isDiscrepancyEvidence: true }
        ));
      }

      // Enviar los datos estructurados para la discrepancia
      await firstValueFrom(this.voucherService.reportClientDiscrepancy(this.valeEncontrado.folio, payload));
      
      this.isSubmittingDiscrepancy = false;
      this.discrepancySuccess = 'Discrepancia reportada y enviada a autorización.';
      
      setTimeout(() => {
        this.discrepancySuccess = '';
        this.cerrarModalInconsistencia();
        this.reset();
      }, 3000);
      
    } catch (err: any) {
      this.isSubmittingDiscrepancy = false;
      this.discrepancyError = err.error?.message || err.message || 'Error al reportar discrepancia.';
    }
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
