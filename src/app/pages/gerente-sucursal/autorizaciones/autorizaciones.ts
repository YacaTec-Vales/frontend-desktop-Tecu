import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutorizacionService, AutorizacionResponseDto } from '../../../core/services/autorizacion.service';
import { CardComponent } from '../../../components/ui/card/card';
import { TableComponent } from '../../../components/ui/table/table';
import { ButtonComponent } from '../../../components/ui/button/button';
import { ModalComponent } from '../../../components/ui/modal/modal';

@Component({
  selector: 'app-autorizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent],
  templateUrl: './autorizaciones.html',
})
export class Autorizaciones implements OnInit {
  autorizaciones: AutorizacionResponseDto[] = [];
  isLoading = false;

  // Token Modal State
  isTokenModalOpen = false;
  generatedToken = '';

  constructor(private autorizacionService: AutorizacionService) {}

  ngOnInit() {
    this.loadAutorizaciones();
  }

  loadAutorizaciones() {
    this.isLoading = true;
    this.autorizacionService.getAutorizaciones().subscribe({
      next: (data) => {
        // Filter pending authorizations or just show all
        this.autorizaciones = data.filter(a => a.status === 'PENDIENTE');
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  aprobar(auth: AutorizacionResponseDto) {
    // Some endpoints may require payload, assuming empty for now or justification
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
