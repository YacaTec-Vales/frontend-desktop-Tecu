import { Component, inject, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { QRCodeComponent } from 'angularx-qrcode';
import { LayoutModule, BreakpointObserver } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  validatePasswordsMatch,
  validateMfaCode,
} from '../../core/validators/form-validators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, QRCodeComponent, LayoutModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit, OnDestroy {
  email = '';
  password = '';
  error = '';
  success = '';
  isLoading = false;
  step: 'login' | 'mfa_verify' | 'mfa_setup' | 'change_password' = 'login';
  mfaCode = '';
  partialToken = '';
  otpauthUrl = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  isMobileOrTablet = false;

  /** Errores por campo (se muestran inline tras el primer submit). */
  emailError = '';
  passwordError = '';
  mfaCodeError = '';
  currentPasswordError = '';
  newPasswordError = '';
  confirmPasswordError = '';

  /**
   * Secret TOTP en base32 extraido del `otpauthUrl`. El backend lo embebe
   * como query param `secret=...` segun RFC 6238 / Google Authenticator
   * key URI format. Se muestra al usuario para que pueda copiarlo a su
   * gestor de TOTP preferido (Keepass, Bitwarden, 1Password, etc.) sin
   * necesidad de escanear el QR.
   */
  totpSecret = '';
  /** Texto de feedback del boton "Copiar" (vacio = estado normal). */
  copyFeedback = '';

  private router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private breakpointObserver = inject(BreakpointObserver);
  private destroyed = new Subject<void>();

  ngOnInit() {
    this.breakpointObserver
      .observe(['(max-width: 1023px)']) // Mobile + Tablet (Tailwind < lg)
      .pipe(takeUntil(this.destroyed))
      .subscribe(result => {
        this.isMobileOrTablet = result.matches;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  /**
   * Detecta si el campo email acepta formato email o username y valida.
   * Si contiene @ se trata como email; si no, como username Mis Vales.
   */
  private validateEmailField(): string {
    const v = (this.email || '').trim();
    if (!v) return 'Por favor, ingrese su correo electronico o usuario.';
    if (v.length > 254) return 'El correo electronico es demasiado largo.';
    if (v.includes('@')) return validateEmail(v);
    return validateUsername(v);
  }

  private validatePasswordField(): string {
    if (!this.password) return 'Por favor, ingrese su contrasena.';
    if (this.password.length < 8) {
      return 'La contrasena debe tener al menos 8 caracteres.';
    }
    return '';
  }

  private validateMfaCodeField(): string {
    return validateMfaCode(this.mfaCode);
  }

  private validateCurrentPasswordField(): string {
    if (!this.currentPassword) return 'Ingresa tu contrasena actual.';
    return '';
  }

  private validateNewPasswordField(): string {
    if (!this.newPassword) return 'Ingresa la nueva contrasena.';
    if (this.newPassword === this.currentPassword && !!this.currentPassword) {
      return 'La nueva contrasena debe ser diferente a la actual.';
    }
    return validatePassword(this.newPassword);
  }

  private validateConfirmPasswordField(): string {
    if (!this.confirmPassword) return 'Confirma la nueva contrasena.';
    return validatePasswordsMatch(this.newPassword, this.confirmPassword);
  }

  /** Limpia todos los errores por campo. Llamado al cambiar de step. */
  private clearFieldErrors(): void {
    this.emailError = '';
    this.passwordError = '';
    this.mfaCodeError = '';
    this.currentPasswordError = '';
    this.newPasswordError = '';
    this.confirmPasswordError = '';
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.error = '';

    this.emailError = this.validateEmailField();
    this.passwordError = this.validatePasswordField();

    if (this.emailError || this.passwordError) {
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.authService.login({ usernameOrEmail: this.email.trim(), password: this.password }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        const loginData = response.data;

        if (loginData.mfaRequired) {
          this.success = 'Credenciales correctas. Por favor ingresa tu codigo TOTP.';
          this.partialToken = loginData.mfaToken;
          this.step = 'mfa_verify';
          this.clearFieldErrors();
          this.cdr.detectChanges();
        } else {
          this.evaluateUserState(loginData.user, loginData.accessToken);
        }
      },
      error: (err) => {
        this.isLoading = false;

        if (err.status === 401 && err.error?.code === 'AUTH.MFA_REQUIRED') {
            this.step = 'mfa_verify';
            this.partialToken = err.error.data?.accessToken || '';
            this.cdr.detectChanges();
            return;
        }

        if (err.error?.error?.code === 'AUTH.MUST_CHANGE_PASSWORD' || err.error?.code === 'AUTH.MUST_CHANGE_PASSWORD') {
            this.step = 'change_password';
            this.currentPassword = this.password;
            if (err.error?.data?.accessToken) {
               sessionStorage.setItem('ACCESS_TOKEN', err.error.data.accessToken);
            }
            this.clearFieldErrors();
            this.cdr.detectChanges();
            return;
        }

        if (err.error && err.error.message) {
          this.error = err.error.message;
        } else if (err.status === 400 || err.status === 401) {
          this.error = 'Credenciales incorrectas. Verifique su usuario y contrasena.';
        } else if (err.status === 403) {
          this.error = 'Su usuario esta inactivo o bloqueado.';
        } else if (err.status === 429) {
          this.error = 'Demasiados intentos. Por favor intente mas tarde.';
        } else {
          this.error = 'Error de conexion con el servidor. Intente nuevamente.';
        }

        this.cdr.detectChanges();
      }
    });
  }

  onMfaVerify(event: Event) {
    event.preventDefault();
    this.error = '';
    this.success = '';

    this.mfaCodeError = this.validateMfaCodeField();
    if (this.mfaCodeError) {
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.authService.verifyMfa(this.partialToken, this.mfaCode).subscribe({
      next: () => {
        this.isLoading = false;
        this.success = 'TOTP correcto. Iniciando sesion...';
        const user = this.authService.currentUser();
        if (user) {
          this.evaluateUserState(user, sessionStorage.getItem('ACCESS_TOKEN') || '');
        } else {
          this.error = 'No se pudo obtener la informacion del usuario.';
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Codigo de verificacion invalido.';
        this.cdr.detectChanges();
      }
    });
  }

  onMfaSetup(event: Event) {
    event.preventDefault();
    this.error = '';
    this.success = '';

    this.mfaCodeError = this.validateMfaCodeField();
    if (this.mfaCodeError) {
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.authService.verifyMfaSetup(this.partialToken, this.mfaCode).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.success = 'MFA configurado correctamente. Iniciando sesion...';
        const token = res.data?.accessToken || res.accessToken || this.partialToken;
        sessionStorage.setItem('ACCESS_TOKEN', token);

        // Re-fetch me to get the updated role/user
        this.authService.getMe().subscribe(user => {
          this.evaluateUserState(user, sessionStorage.getItem('ACCESS_TOKEN') || '');
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'El codigo es invalido. Intenta de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }

  private navigateToRole(role: string) {
    if (role === 'VERIFICADOR' || role === 'COORDINADOR' || role === 'DISTRIBUIDORA') {
      this.error = 'No tienes acceso a este sitio. Tu nivel de acceso y las proporciones de este sistema son exclusivos de la plataforma web de escritorio.';
      return;
    }

    if (role === 'CAJERO' || role === 'CAJERA') {
      this.router.navigate(['/cajera/liberacion']);
    } else if (role === 'GERENTE_SUCURSAL') {
      this.router.navigate(['/gerente-sucursal/plantilla']);
    } else if (role === 'GERENTE_GENERAL') {
      this.router.navigate(['/gerente-general/catalogos']);
    } else if (role === 'ADMINISTRADOR') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.error = 'Rol no autorizado para acceder al sistema.';
    }
  }

  onChangePasswordSubmit(event: Event) {
    event.preventDefault();
    this.error = '';
    this.success = '';

    this.currentPasswordError = this.validateCurrentPasswordField();
    this.newPasswordError = this.validateNewPasswordField();
    this.confirmPasswordError = this.validateConfirmPasswordField();

    if (this.currentPasswordError || this.newPasswordError || this.confirmPasswordError) {
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.authService.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.success = 'Contrasena actualizada. Redirigiendo...';
        const user = this.authService.currentUser();
        if (user) {
          this.evaluateUserState(user, sessionStorage.getItem('ACCESS_TOKEN') || '');
        } else {
          this.error = 'No se pudo obtener informacion del usuario.';
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Error al actualizar la contrasena.';
        this.cdr.detectChanges();
      }
    });
  }

  private evaluateUserState(user: any, token: string) {
    // Si tenemos un token (ya sea completo o parcial), lo guardamos para que el interceptor lo use
    if (token) {
      sessionStorage.setItem('ACCESS_TOKEN', token);
    }

    if (user.mustChangePassword) {
      this.step = 'change_password';
      this.currentPassword = this.password; // asumiendo que this.password aún tiene la contraseña del form
      this.cdr.detectChanges();
        } else if (user.mfaEnabled === false) {
          this.success = 'Credenciales correctas. Configura tu Autenticador.';
          this.partialToken = token || this.partialToken;
          this.authService.setupMfa(this.partialToken).subscribe({
            next: (setupRes: any) => {
              this.otpauthUrl = setupRes.data?.otpauthUrl || setupRes.otpauthUrl;
              this.totpSecret = this.extractTotpSecret(this.otpauthUrl);
              this.step = 'mfa_setup';
              this.cdr.detectChanges();
            },
            error: (err) => {
              this.error = err.error?.message || err.error?.error?.message || 'Error generando código de configuración MFA.';
              this.cdr.detectChanges();
            }
          });
    } else {
      this.success = 'Inicio de sesión exitoso.';
      this.cdr.detectChanges();
      this.navigateToRole(user.role);
    }
  }

  goBack() {
    this.step = 'login';
    this.mfaCode = '';
    this.error = '';
    this.success = '';
    this.partialToken = '';
    this.otpauthUrl = '';
    this.totpSecret = '';
    this.copyFeedback = '';
    this.clearFieldErrors();
}

  /**
   * Extrae el secret TOTP (base32) del `otpauth://totp/...` URI.
   *
   * Formato esperado (RFC 6238 / Google Authenticator key URI):
   *   otpauth://totp/<issuer>:<account>?secret=<BASE32>&issuer=<issuer>&algorithm=SHA1&digits=6&period=30
   *
   * Devuelve una cadena vacia si el formato no es el esperado (en cuyo
   * caso la UI sigue mostrando solo el QR).
   */
  private extractTotpSecret(otpauthUrl: string): string {
    if (!otpauthUrl) return '';
    try {
      // El valor puede venir URL-encoded; usar el constructor URL
      // garantiza el manejo correcto.
      const url = new URL(otpauthUrl);
      const secret = url.searchParams.get('secret');
      return (secret ?? '').trim();
    } catch {
      // Fallback: parseo manual si URL() falla (caso edge con esquema no
      // reconocido por algunos browsers viejos).
      const idx = otpauthUrl.indexOf('secret=');
      if (idx === -1) return '';
      const tail = otpauthUrl.substring(idx + 'secret='.length);
      const ampIdx = tail.indexOf('&');
      return decodeURIComponent(ampIdx === -1 ? tail : tail.substring(0, ampIdx));
    }
  }

  /**
   * Copia el secret TOTP al portapapeles. Usa la Clipboard API moderna
   * (`navigator.clipboard.writeText`) con fallback al metodo legacy
   * `document.execCommand('copy')` para entornos sin HTTPS o sin
   * soporte de la Clipboard API.
   */
  async copySecretToClipboard(): Promise<void> {
    if (!this.totpSecret) return;
    const ok = await copyTextToClipboard(this.totpSecret);
    this.copyFeedback = ok ? '¡Copiado!' : 'No se pudo copiar';
    this.cdr.detectChanges();
    if (ok) {
      setTimeout(() => {
        this.copyFeedback = '';
        this.cdr.detectChanges();
      }, 2000);
    }
  }
}

/**
 * Helper aislado para copiar texto al portapapeles. Se expone a nivel
 * de modulo (no como metodo de la clase) para que sea trivialmente
 * testeable sin instanciar el componente Login.
 *
 * Estrategia:
 *   1. Si el navegador expone `navigator.clipboard.writeText` en un
 *      contexto seguro (HTTPS o localhost), usarlo.
 *   2. Si falla o no esta disponible, fallback a un `<textarea>`
 *      invisible + `document.execCommand('copy')`. Esto cubre
 *      navegadores viejos o contextos sin HTTPS.
 *
 * @returns `true` si el texto quedo en el portapapeles; `false` si
 *   ambos metodos fallaron.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof text !== 'string' || text.length === 0) return false;

  // Camino 1: Clipboard API moderna.
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function' &&
      typeof window !== 'undefined' &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // cae al fallback
  }

  // Camino 2: fallback legacy (deprecated pero sigue funcionando en
  // navegadores sin HTTPS / contextos sin Clipboard API).
  if (typeof document === 'undefined') return false;
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '0';
  ta.style.left = '0';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    return document.execCommand('copy') === true;
  } catch {
    return false;
  } finally {
    document.body.removeChild(ta);
  }
}
