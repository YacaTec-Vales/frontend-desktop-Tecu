import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-aprobaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aprobaciones.component.html'
})
export class AprobacionesComponent {
  activeTab: string = 'distribuidoras';

  setTab(tab: string) {
    this.activeTab = tab;
  }
}
