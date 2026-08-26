import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  isSidebarOpen = true;
  private authService = inject(AuthService);
  private router = inject(Router);

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout(): void {
    this.authService.logout();
  }
}
