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

  step: 'login' | 'mfa_verify' | 'mfa_setup' = 'login';
  mfaCode: string = '';
  pendingRolePath: string = '';

  constructor(private router: Router) {}

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.email === 'cajera@empresa.com') {
      this.router.navigate(['/cajera/liberacion']);
    } else if (this.email === 'gerente_sucursal@empresa.com') {
      this.pendingRolePath = '/gerente-sucursal/plantilla';
      this.step = 'mfa_verify';
      this.error = '';
    } else if (this.email === 'gerente_general@empresa.com') {
      this.pendingRolePath = '/gerente-general/catalogos';
      this.step = 'mfa_setup';
      this.error = '';
    } else {
      this.error = 'Usuario no reconocido. Utilice las credenciales de prueba mostradas abajo.';
    }
  }

  onMfaVerify(event: Event) {
    event.preventDefault();
    if (this.mfaCode.length === 6) {
      this.router.navigate([this.pendingRolePath]);
    } else {
      this.error = 'El código debe tener 6 dígitos.';
    }
  }

  onMfaSetup(event: Event) {
    event.preventDefault();
    if (this.mfaCode.length === 6) {
      // MFA config success, continue to dash
      this.router.navigate([this.pendingRolePath]);
    } else {
      this.error = 'El código debe tener 6 dígitos para validar el autenticador.';
    }
  }

  goBack() {
    this.step = 'login';
    this.mfaCode = '';
    this.error = '';
  }
}
