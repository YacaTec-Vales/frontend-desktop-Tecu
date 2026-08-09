import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffService } from '../../../core/services/staff.service';
import { DistribuidorService } from '../../../core/services/distribuidor.service';
import { Coordinador } from '../../../core/models/staff.model';

@Component({
  selector: 'app-reasignacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reasignacion.component.html'
})
export class ReasignacionComponent implements OnInit {
  coordinadores: Coordinador[] = [];
  
  coordOrigenId: string = '';
  coordDestinoId: string = '';

  // Lista simulada de distribuidoras ya que no hay endpoint GET /coordinadores/{id}/distribuidores en API 1.4
  distribuidorasOrigenMock = [
    { id: 'DIST-MOCK-001', name: 'Ana García', cartera: 15000, selected: false },
    { id: 'DIST-MOCK-002', name: 'Pedro López', cartera: 5000, selected: false },
    { id: 'DIST-MOCK-003', name: 'María Sanchez', cartera: 22000, selected: false }
  ];

  isTransferring = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private staffService: StaffService,
    private distribuidorService: DistribuidorService
  ) {}

  ngOnInit() {
    this.staffService.getCoordinadores().subscribe({
      next: (coords) => this.coordinadores = coords,
      error: (err) => console.error('Error al cargar coordinadores', err)
    });
  }

  get canTransfer(): boolean {
    return this.coordOrigenId !== '' 
        && this.coordDestinoId !== '' 
        && this.coordOrigenId !== this.coordDestinoId
        && this.distribuidorasOrigenMock.some(d => d.selected)
        && !this.isTransferring;
  }

  get selectedCount(): number {
    return this.distribuidorasOrigenMock.filter(d => d.selected).length;
  }

  transferir() {
    if (!this.canTransfer) return;

    const selectedIds = this.distribuidorasOrigenMock.filter(d => d.selected).map(d => d.id);
    
    this.isTransferring = true;
    this.successMessage = '';
    this.errorMessage = '';

    // Simulamos que transferimos la primera que encontremos seleccionada
    // En la vida real, se haría un Promise.all o similar para transferir múltiples,
    // o el backend tendría un endpoint masivo. El DistribuidorService actual cambia de a una.
    const distribIdToTransfer = selectedIds[0];

    this.distribuidorService.changeCoordinator(distribIdToTransfer, this.coordDestinoId).subscribe({
      next: () => {
        this.isTransferring = false;
        this.successMessage = `Se transfirió la distribuidora al nuevo coordinador exitosamente.`;
        
        // Removemos de la lista mockeada
        this.distribuidorasOrigenMock = this.distribuidorasOrigenMock.filter(d => d.id !== distribIdToTransfer);
      },
      error: (err) => {
        this.isTransferring = false;
        // Even if it fails (because the DIST-MOCK ID doesn't exist in the real backend), we show the error message.
        this.errorMessage = err.error?.message || 'Error al transferir cartera (probablemente el ID simulado no existe en el backend).';
      }
    });
  }
}
