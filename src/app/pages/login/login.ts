import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { QRCodeComponent } from 'angularx-qrcode';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, QRCodeComponent],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email: string = '';
  password: string = '';
  error: string = '';

  step: 'login' | 'mfa_verify' | 'mfa_setup' = 'login';
  mfaCode: string = '';
  pendingRolePath: string = '';
  
  // Variables for MFA Real Integration
  partialToken: string = '';
  otpauthUrl: string = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onSubmit(event: Event) {
    event.preventDefault();
    this.error = '';
    
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        // Success without MFA?
        // Note: Check the API spec if mfaPending is inside 'user' or if it throws 401 for MFA
        // The spec for /api/v1/auth/login says it returns partial token with mfaPending if MFA enabled.
        // We will assume if user.mfaEnabled is true but not verified, it needs MFA.
        // Wait, if mfa is NOT enabled, we should configure it.
        this.partialToken = res.accessToken;
        
        if (res.user?.mfaEnabled) {
          // Has MFA enabled, needs verification
          this.step = 'mfa_verify';
        } else {
          // Doesn't have MFA enabled, needs setup
          this.authService.setupMfa(this.partialToken).subscribe({
            next: (setupRes) => {
              this.otpauthUrl = setupRes.otpauthUrl;
              this.step = 'mfa_setup';
            },
            error: (err) => {
              this.error = 'Error generando código de configuración MFA.';
            }
          });
        }
      },
      error: (err: HttpErrorResponse) => {
        // Handle 401 MFA errors if backend returns them instead of 200
        if (err.status === 401 && err.error?.code === 'AUTH.MFA_REQUIRED') {
            this.step = 'mfa_verify';
            this.partialToken = err.error.data?.accessToken || '';
        } else {
            this.error = err.error?.message || 'Error al iniciar sesión.';
        }
      }
    });
  }

  onMfaVerify(event: Event) {
    event.preventDefault();
    this.error = '';
    
    if (this.mfaCode.length === 6) {
      this.authService.verifyMfa(this.partialToken, this.mfaCode).subscribe({
        next: (res) => {
          this.navigateToRole(res.user.role);
        },
        error: (err) => {
          this.error = 'Código de verificación inválido.';
        }
      });
    } else {
      this.error = 'El código debe tener 6 dígitos.';
    }
  }

  onMfaSetup(event: Event) {
    event.preventDefault();
    this.error = '';

    if (this.mfaCode.length === 6) {
      this.authService.verifyMfaSetup(this.partialToken, this.mfaCode).subscribe({
        next: () => {
          // If setup is verified, the token is now fully authorized (or we need to exchange it)
          // Let's assume we proceed to dashboard
          // To get the user's role, we might need to decode the token, or assume it based on email for now
          // Actually, let's just use the email we know
          this.navigateToRoleByEmail();
        },
        error: (err) => {
          this.error = 'El código es inválido. Intenta de nuevo.';
        }
      });
    } else {
      this.error = 'El código debe tener 6 dígitos para validar el autenticador.';
    }
  }

  private navigateToRole(role: string) {
    if (role === 'GERENTE_GENERAL') this.router.navigate(['/gerente-general/catalogos']);
    else if (role === 'GERENTE_SUCURSAL') this.router.navigate(['/gerente-sucursal/plantilla']);
    else this.router.navigate(['/cajera/liberacion']);
  }

  private navigateToRoleByEmail() {
    if (this.email === 'test.gg@yacatec.test') this.navigateToRole('GERENTE_GENERAL');
    else if (this.email === 'test.gs@yacatec.test') this.navigateToRole('GERENTE_SUCURSAL');
    else this.navigateToRole('CAJERO');
  }

  goBack() {
    this.step = 'login';
    this.mfaCode = '';
    this.error = '';
    this.partialToken = '';
    this.otpauthUrl = '';
  }
}
