import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';
import { VpnOnlyDirective } from '../../../core/directives/vpn-only.directive';

@Component({
  selector: 'app-configuracion-local',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, ButtonComponent, VpnOnlyDirective],
  templateUrl: './configuracion.component.html'
})
export class ConfiguracionComponent {
  fechaCorte: string = '';
  fechaPago: string = '';
  guardado: boolean = false;

  guardarFechas() {
    if (this.fechaCorte && this.fechaPago) {
      // Simulación de guardado
      this.guardado = true;
      setTimeout(() => this.guardado = false, 3000);
    }
  }
}
