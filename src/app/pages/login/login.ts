import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email: string = '';
  error: string = '';

  constructor(private router: Router) {}

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.email === 'admin@empresa.com') {
      this.router.navigate(['/admin/punto-atencion']);
    } else if (this.email === 'gerente_sucursal@empresa.com') {
      this.router.navigate(['/gerente-sucursal/dashboard']);
    } else if (this.email === 'gerente_general@empresa.com') {
      this.router.navigate(['/gerente-general/panel-corporativo']);
    } else {
      this.error = 'Usuario no reconocido. Utilice las credenciales de prueba mostradas abajo.';
    }
  }
}
