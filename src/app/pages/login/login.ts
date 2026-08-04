import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email = '';
  password = '';
  error = '';
  isLoading = false;

  private router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  onSubmit(event: Event) {
    event.preventDefault();
    this.error = '';
    
    if (!this.email || !this.password) {
      this.error = 'Por favor, ingrese sus credenciales.';
      return;
    }

    this.isLoading = true;
    this.authService.login({ usernameOrEmail: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        const user = response.user;
        
        // Verificamos si la nueva API requiere cambio de contraseña mandatorio
        if (user.mustChangePassword) {
          console.warn('El usuario debe cambiar la contraseña');
          // this.router.navigate(['/cambiar-password']); // Implementar luego si es necesario
        }

        this.cdr.detectChanges(); // Forzar actualización de la UI

        // Enrutamiento en base al rol del usuario devuelto por el backend
        if (user.role === 'CAJERO' || user.role === 'CAJERA') {
          this.router.navigate(['/cajera/liberacion']);
        } else if (user.role === 'GERENTE_SUCURSAL') {
          this.router.navigate(['/gerente-sucursal/plantilla']);
        } else if (user.role === 'GERENTE_GENERAL') {
          this.router.navigate(['/gerente-general/catalogos']);
        } else {
          this.error = 'Rol no autorizado para acceder al sistema.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        
        // Manejo de errores dinámico basado en la respuesta del backend
        if (err.error && err.error.message) {
          this.error = err.error.message;
          
        } else if (err.status === 400 || err.status === 401) {
          this.error = 'Credenciales incorrectas. Verifique su usuario y contraseña.';
        } else if (err.status === 403) {
          this.error = 'Su usuario está inactivo o bloqueado.';
        } else if (err.status === 429) {
          this.error = 'Demasiados intentos. Por favor intente más tarde.';
        } else {
          this.error = 'Error de conexión con el servidor. Intente nuevamente.';
        }
        
        this.cdr.detectChanges(); // Forzar actualización de la UI inmediatamente
      }
    });
  }
}
