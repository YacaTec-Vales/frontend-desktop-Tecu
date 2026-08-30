import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutorizacionService, AutorizacionResponseDto } from '../../../core/services/autorizacion.service';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';
import { InputComponent } from '../../../components/ui/input/input';
import { SafeUrlPipe } from '../../../core/pipes/safe-url.pipe';
import { VpnOnlyDirective } from '../../../core/directives/vpn-only.directive';

@Component({
  selector: 'app-autorizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, ButtonComponent, ModalComponent, TableComponent, InputComponent, SafeUrlPipe, VpnOnlyDirective],
  templateUrl: './autorizaciones.html',
})
export class Autorizaciones implements OnInit {
  autorizaciones: AutorizacionResponseDto[] = [];
  isLoading = false;

  // Token Modal State
  isTokenModalOpen = false;
  generatedToken = '';

  // Resolve Modal State
  isResolveModalOpen = false;
  selectedAuth: AutorizacionResponseDto | null = null;
  isSubmitting = false;
  resolveError = '';
  resolveSuccess = '';

  constructor(
    private autorizacionService: AutorizacionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAutorizaciones();
  }

  loadAutorizaciones() {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.autorizacionService.getAutorizaciones().subscribe({
      next: (data) => {
        // Filter pending authorizations or just show all
        let authList = [];
        if (Array.isArray(data)) {
          authList = data;
        } else if (data && Array.isArray((data as any).data)) {
          authList = (data as any).data;
        }
        
        this.autorizaciones = authList.filter((a: any) => a?.status === 'PENDIENTE');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openResolveModal(auth: AutorizacionResponseDto) {
    this.selectedAuth = JSON.parse(JSON.stringify(auth));
    
    if (this.selectedAuth?.authorizationType === 'MODIFICACION_CLIENTE') {
      if (!this.selectedAuth.affectedEntity.discrepancyData) {
        this.selectedAuth.affectedEntity.discrepancyData = {};
      }
      if (!this.selectedAuth.affectedEntity.discrepancyData.bankAccount) {
        this.selectedAuth.affectedEntity.discrepancyData.bankAccount = {};
      }
    }
    
    this.isResolveModalOpen = true;
  }

  cerrarResolveModal() {
    this.isResolveModalOpen = false;
    this.selectedAuth = null;
    this.resolveError = '';
    this.resolveSuccess = '';
  }

  aprobarModificacionCliente() {
    if (!this.selectedAuth) return;
    this.isSubmitting = true;
    
    // We send back the potentially modified discrepancyData as the approved updateClientData
    const payload = {
      updateClientData: this.selectedAuth.affectedEntity.discrepancyData
    };

    this.autorizacionService.approveClientModification(this.selectedAuth.id, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.resolveSuccess = 'Modificación de cliente aprobada correctamente.';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.resolveSuccess = '';
          this.cerrarResolveModal();
          this.loadAutorizaciones();
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.resolveError = err.error?.message || err.message || 'Error al aprobar la modificación.';
        this.cdr.detectChanges();
      }
    });
  }

  aprobar(auth: AutorizacionResponseDto) {
    this.autorizacionService.aprobarAutorizacion(auth.id, { justification: 'Aprobado por GG' }).subscribe({
      next: (res: any) => {
        if (res?.data?.token) {
          this.generatedToken = res.data.token;
          this.isTokenModalOpen = true;
        }
        this.loadAutorizaciones();
      }
    });
  }

  rechazar(auth: AutorizacionResponseDto) {
    if (confirm('¿Está seguro de rechazar esta solicitud?')) {
      this.autorizacionService.rechazarAutorizacion(auth.id, { justification: 'Rechazado por GG' }).subscribe(() => {
        this.loadAutorizaciones();
      });
    }
  }
}
