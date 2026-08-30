import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { VpnIndicatorComponent } from '../../../core/components/vpn-indicator/vpn-indicator.component';
import { VpnReadonlyBannerComponent } from '../../../core/components/vpn-readonly-banner/vpn-readonly-banner.component';

@Component({
  selector: 'app-cajera-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    VpnIndicatorComponent,
    VpnReadonlyBannerComponent,
  ],
  templateUrl: './layout.component.html'
})
export class LayoutComponent {
  isSidebarOpen = true;
  private authService = inject(AuthService);

  constructor(private router: Router) {}

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout() {
    this.authService.logout();
  }
}
