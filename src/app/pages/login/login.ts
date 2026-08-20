import { Component, ChangeDetectorRef } from '@angular/core';
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
  success: string = '';

  step: 'login' | 'mfa_verify' | 'mfa_setup' = 'login';
  mfaCode: string = '';
  pendingRolePath: string = '';
  
  // Variables for MFA Real Integration
  partialToken: string = '';
  otpauthUrl: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(event: Event) {
    event.preventDefault();
    this.error = '';
    this.success = '';
    
    this.authService.login({ usernameOrEmail: this.email, password: this.password }).subscribe({
      next: (res: any) => {
        const loginData = res.data;
        
        if (loginData.mfaRequired) {
          // User has MFA enabled and needs to verify
          this.success = 'Credenciales correctas. Por favor ingresa tu código TOTP.';
          this.partialToken = loginData.mfaToken;
          this.step = 'mfa_verify';
          this.cdr.detectChanges();
        } else if (loginData.user?.mfaEnabled === false) {
          // User doesn't have MFA enabled, needs setup
          this.success = 'Credenciales correctas. Configura tu Autenticador.';
          this.partialToken = loginData.accessToken;
          this.authService.setupMfa(this.partialToken).subscribe({
            next: (setupRes: any) => {
              this.otpauthUrl = setupRes.data?.otpauthUrl || setupRes.otpauthUrl;
              this.step = 'mfa_setup';
              this.cdr.detectChanges();
            },
            error: (err) => {
              this.error = 'Error generando código de configuración MFA.';
              this.cdr.detectChanges();
            }
          });
        } else {
          // Fully logged in, no MFA steps pending
          this.success = 'Inicio de sesión exitoso.';
          sessionStorage.setItem('token', loginData.accessToken);
          this.navigateToRole(loginData.user.role);
        }
      },
      error: (err: HttpErrorResponse) => {
        // Handle 401 MFA errors if backend returns them instead of 200
        if (err.status === 401 && err.error?.code === 'AUTH.MFA_REQUIRED') {
            this.step = 'mfa_verify';
            this.partialToken = err.error.data?.accessToken || '';
            this.cdr.detectChanges();
        } else {
            this.error = err.error?.message || 'Error al iniciar sesión.';
            this.cdr.detectChanges();
        }
      }
    });
  }

  onMfaVerify(event: Event) {
    event.preventDefault();
    this.error = '';
    this.success = '';
    
    if (this.mfaCode.length === 6) {
      this.authService.verifyMfa(this.partialToken, this.mfaCode).subscribe({
        next: (res: any) => {
          this.success = 'TOTP correcto. Iniciando sesión...';
          const token = res.data?.accessToken || res.accessToken;
          const userData = res.data?.user || res.user;
          sessionStorage.setItem('token', token);
          this.navigateToRole(userData.role);
        },
        error: (err) => {
          this.error = 'Código de verificación inválido.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.error = 'El código debe tener 6 dígitos.';
    }
  }

  onMfaSetup(event: Event) {
    event.preventDefault();
    this.error = '';
    this.success = '';
    
    if (this.mfaCode.length === 6) {
      this.authService.verifyMfaSetup(this.partialToken, this.mfaCode).subscribe({
        next: (res: any) => {
          this.success = 'MFA configurado correctamente. Iniciando sesión...';
          // On setup, the backend might return the final token, or we might just use the partial token
          const token = res.data?.accessToken || res.accessToken || this.partialToken;
          sessionStorage.setItem('token', token);
          this.navigateToRoleByEmail();
        },
        error: (err) => {
          this.error = 'El código es inválido. Intenta de nuevo.';
          this.cdr.detectChanges();
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
    this.success = '';
    this.partialToken = '';
    this.otpauthUrl = '';
  }
}
