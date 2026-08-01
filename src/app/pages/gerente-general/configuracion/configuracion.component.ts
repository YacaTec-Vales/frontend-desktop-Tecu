import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../../components/ui/card/card';
import { InputComponent } from '../../../components/ui/input/input';
import { ButtonComponent } from '../../../components/ui/button/button';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, InputComponent, ButtonComponent],
  templateUrl: './configuracion.component.html'
})
export class ConfiguracionComponent {
  fechaCorte: string = '';
  fechaPago: string = '';
  isSaving = false;
  successMessage = '';

  guardarFechas() {
    this.isSaving = true;
    this.successMessage = '';
    
    // Simular guardado
    setTimeout(() => {
      this.isSaving = false;
      this.successMessage = 'Fechas actualizadas correctamente. Todas las sucursales han sido notificadas.';
      
      // Ocultar mensaje después de 4s
      setTimeout(() => this.successMessage = '', 4000);
    }, 1200);
  }
}
