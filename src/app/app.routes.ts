import { Routes } from '@angular/router';

// Login
import { Login } from './pages/login/login';

// Admin Layout & Pages
import { Layout as AdminLayout } from './pages/admin/layout/layout';
import { PuntoAtencion } from './pages/admin/punto-atencion/punto-atencion';
import { CajaDispersion } from './pages/admin/caja-dispersion/caja-dispersion';
import { CargaArchivos } from './pages/admin/carga-archivos/carga-archivos';
import { Conciliacion } from './pages/admin/conciliacion/conciliacion';
import { Tokens } from './pages/admin/tokens/tokens';

// Gerente Sucursal Layout & Pages
import { LayoutComponent as GerenteSucursalLayout } from './pages/gerente-sucursal/layout/layout.component';
import { DashboardComponent as SucursalDashboard } from './pages/gerente-sucursal/dashboard/dashboard.component';
import { AprobacionesComponent } from './pages/gerente-sucursal/aprobaciones/aprobaciones.component';
import { PlantillaComponent } from './pages/gerente-sucursal/plantilla/plantilla.component';
import { ReasignacionComponent } from './pages/gerente-sucursal/reasignacion/reasignacion.component';

// Gerente General Layout & Pages
import { LayoutComponent as GerenteGeneralLayout } from './pages/gerente-general/layout/layout.component';
import { PanelCorporativoComponent } from './pages/gerente-general/panel-corporativo/panel-corporativo.component';
import { MotorReglasComponent } from './pages/gerente-general/motor-reglas/motor-reglas.component';
import { CatalogoComponent } from './pages/gerente-general/catalogo/catalogo.component';
import { AutorizacionesComponent } from './pages/gerente-general/autorizaciones/autorizaciones.component';
import { AuditoriaComponent } from './pages/gerente-general/auditoria/auditoria.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      { path: '', redirectTo: 'punto-atencion', pathMatch: 'full' },
      { path: 'punto-atencion', component: PuntoAtencion },
      { path: 'caja-dispersion', component: CajaDispersion },
      { path: 'carga-archivos', component: CargaArchivos },
      { path: 'conciliacion', component: Conciliacion },
      { path: 'tokens', component: Tokens }
    ]
  },
  {
    path: 'gerente-sucursal',
    component: GerenteSucursalLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: SucursalDashboard },
      { path: 'aprobaciones', component: AprobacionesComponent },
      { path: 'plantilla', component: PlantillaComponent },
      { path: 'reasignacion', component: ReasignacionComponent }
    ]
  },
  {
    path: 'gerente-general',
    component: GerenteGeneralLayout,
    children: [
      { path: '', redirectTo: 'panel-corporativo', pathMatch: 'full' },
      { path: 'panel-corporativo', component: PanelCorporativoComponent },
      { path: 'motor-reglas', component: MotorReglasComponent },
      { path: 'catalogo', component: CatalogoComponent },
      { path: 'autorizaciones', component: AutorizacionesComponent },
      { path: 'auditoria', component: AuditoriaComponent }
    ]
  }
];
