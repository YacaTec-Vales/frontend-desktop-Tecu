import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

// Login
import { Login } from './pages/login/login';

// Cajera Layout & Pages
import { LayoutComponent as CajeraLayout } from './pages/cajera/layout/layout.component';
import { LiberacionComponent } from './pages/cajera/liberacion/liberacion.component';
import { ConciliacionComponent } from './pages/cajera/conciliacion/conciliacion.component';

// Gerente Sucursal Layout & Pages
import { LayoutComponent as GerenteSucursalLayout } from './pages/gerente-sucursal/layout/layout.component';
import { PlantillaComponent } from './pages/gerente-sucursal/plantilla/plantilla.component';
import { ConfiguracionComponent as SucursalConfiguracion } from './pages/gerente-sucursal/configuracion/configuracion.component';
import { AprobacionesComponent as SucursalAprobaciones } from './pages/gerente-sucursal/aprobaciones/aprobaciones.component';
import { ReportesComponent as SucursalReportes } from './pages/gerente-sucursal/reportes/reportes.component';
import { ReasignacionComponent } from './pages/gerente-sucursal/reasignacion/reasignacion.component';

// Gerente General Layout & Pages
import { LayoutComponent as GerenteGeneralLayout } from './pages/gerente-general/layout/layout.component';
import { CatalogosComponent } from './pages/gerente-general/catalogos/catalogos.component';
import { ConfiguracionComponent } from './pages/gerente-general/configuracion/configuracion.component';
import { AprobacionesComponent as GerenteGeneralAprobaciones } from './pages/gerente-general/aprobaciones/aprobaciones.component';
import { ReportesComponent } from './pages/gerente-general/reportes/reportes.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  {
    path: 'cajera',
    component: CajeraLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'liberacion', pathMatch: 'full' },
      { path: 'liberacion', component: LiberacionComponent },
      { path: 'conciliacion', component: ConciliacionComponent }
    ]
  },
  {
    path: 'gerente-sucursal',
    component: GerenteSucursalLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'plantilla', pathMatch: 'full' },
      { path: 'plantilla', component: PlantillaComponent },
      { path: 'configuracion', component: SucursalConfiguracion },
      { path: 'aprobaciones', component: SucursalAprobaciones },
      { path: 'reportes', component: SucursalReportes },
      { path: 'reasignacion', component: ReasignacionComponent }
    ]
  },
  {
    path: 'gerente-general',
    component: GerenteGeneralLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'catalogos', pathMatch: 'full' },
      { path: 'catalogos', component: CatalogosComponent },
      { path: 'configuracion', component: ConfiguracionComponent },
      { path: 'aprobaciones', component: GerenteGeneralAprobaciones },
      { path: 'reportes', component: ReportesComponent }
    ]
  }
];
