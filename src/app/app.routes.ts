import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard, SYSTEM_ROLES } from './core/guards/role.guard';

// Login
import { Login } from './pages/login/login';

// Cajera Layout & Pages
import { LayoutComponent as CajeraLayout } from './pages/cajera/layout/layout.component';
import { LiberacionComponent } from './pages/cajera/liberacion/liberacion.component';
import { ConciliacionComponent } from './pages/cajera/conciliacion/conciliacion.component';
import { ValesDigitalesComponent } from './pages/cajera/vales-digitales/vales-digitales';

// Gerente Sucursal Layout & Pages
import { LayoutComponent as GerenteSucursalLayout } from './pages/gerente-sucursal/layout/layout.component';
import { PlantillaComponent } from './pages/gerente-sucursal/plantilla/plantilla.component';
import { ConfiguracionComponent as SucursalConfiguracion } from './pages/gerente-sucursal/configuracion/configuracion.component';
import { AprobacionesComponent as SucursalAprobaciones } from './pages/gerente-sucursal/aprobaciones/aprobaciones.component';
import { ReportesComponent as SucursalReportes } from './pages/gerente-sucursal/reportes/reportes.component';
import { ReasignacionComponent } from './pages/gerente-sucursal/reasignacion/reasignacion.component';
import { Autorizaciones as SucursalAutorizaciones } from './pages/gerente-sucursal/autorizaciones/autorizaciones';
import { Distribuidoras as SucursalDistribuidoras } from './pages/gerente-sucursal/distribuidoras/distribuidoras';
import { Relaciones as SucursalRelaciones } from './pages/gerente-sucursal/relaciones/relaciones';

// Gerente General Layout & Pages
import { LayoutComponent as GerenteGeneralLayout } from './pages/gerente-general/layout/layout.component';
import { CatalogosComponent } from './pages/gerente-general/catalogos/catalogos.component';
import { ConfiguracionComponent } from './pages/gerente-general/configuracion/configuracion.component';
import { AprobacionesComponent as GerenteGeneralAprobaciones } from './pages/gerente-general/aprobaciones/aprobaciones.component';
import { ReportesComponent } from './pages/gerente-general/reportes/reportes.component';
import { CorteQuincenaComponent } from './pages/gerente-general/corte-quincena/corte-quincena.component';
import { Autorizaciones } from './pages/gerente-general/autorizaciones/autorizaciones';
import { Distribuidoras } from './pages/gerente-general/distribuidoras/distribuidoras';
import { Relaciones as GerenteGeneralRelaciones } from './pages/gerente-general/relaciones/relaciones';

// Administrador Layout & Pages
import { LayoutComponent as AdminLayout } from './pages/admin/layout/layout.component';
import { DashboardComponent as AdminDashboard } from './pages/admin/dashboard/dashboard.component';
import { BootstrapWizardComponent } from './pages/admin/bootstrap/bootstrap-wizard.component';
import { AuditoriaComponent } from './pages/admin/auditoria/auditoria.component';
import { PanelCorporativoComponent } from './pages/admin/panel-corporativo/panel-corporativo.component';

/**
 * Rutas de la aplicacion.
 *
 * Cada bloque role-scoped se protege con `authGuard` + `roleGuard([<role>])`
 * para reforzar el aislamiento que antes era solo "hay token". El orden
 * de guards importa: primero `authGuard` (valida sesion) y luego
 * `roleGuard` (valida rol). Ambos devuelven UrlTree a /login si fallan.
 */
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },

  // Cajera / Cajero
  {
    path: 'cajera',
    component: CajeraLayout,
    canActivate: [authGuard, roleGuard([SYSTEM_ROLES[6] /* CAJERO */])],
    children: [
      { path: '', redirectTo: 'liberacion', pathMatch: 'full' },
      { path: 'liberacion', component: LiberacionComponent },
      { path: 'conciliacion', component: ConciliacionComponent },
      { path: 'vales-digitales', component: ValesDigitalesComponent },
    ],
  },

  // Gerente de Sucursal
  {
    path: 'gerente-sucursal',
    component: GerenteSucursalLayout,
    canActivate: [authGuard, roleGuard([SYSTEM_ROLES[2] /* GERENTE_SUCURSAL */])],
    children: [
      { path: '', redirectTo: 'plantilla', pathMatch: 'full' },
      { path: 'plantilla', component: PlantillaComponent },
      { path: 'configuracion', component: SucursalConfiguracion },
      { path: 'aprobaciones', component: SucursalAprobaciones },
      { path: 'reportes', component: SucursalReportes },
      { path: 'reasignacion', component: ReasignacionComponent },
      { path: 'autorizaciones', component: SucursalAutorizaciones },
      { path: 'distribuidoras', component: SucursalDistribuidoras },
      { path: 'relaciones', component: SucursalRelaciones },
    ],
  },

  // Gerente General
  {
    path: 'gerente-general',
    component: GerenteGeneralLayout,
    canActivate: [authGuard, roleGuard([SYSTEM_ROLES[1] /* GERENTE_GENERAL */])],
    children: [
      { path: '', redirectTo: 'catalogos', pathMatch: 'full' },
      { path: 'catalogos', component: CatalogosComponent },
      { path: 'configuracion', component: ConfiguracionComponent },
      { path: 'aprobaciones', component: GerenteGeneralAprobaciones },
      { path: 'reportes', component: ReportesComponent },
      { path: 'corte-quincena', component: CorteQuincenaComponent },
      { path: 'autorizaciones', component: Autorizaciones },
      { path: 'distribuidoras', component: Distribuidoras },
      { path: 'relaciones', component: GerenteGeneralRelaciones },
    ],
  },

  // Administrador (rol read-only + bootstrap inicial).
  // El ADMINISTRADOR es el unico con permiso `branch.create.matriz` y
  // `user.create.general_manager` para crear la MATRIZ y el Gerente General
  // en el bootstrap del sistema.
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard, roleGuard([SYSTEM_ROLES[0] /* ADMINISTRADOR */])],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboard },
      { path: 'bootstrap', component: BootstrapWizardComponent },
      { path: 'auditoria', component: AuditoriaComponent },
      { path: 'panel-corporativo', component: PanelCorporativoComponent },
    ],
  },

  // Cualquier ruta desconocida cae al login.
  { path: '**', redirectTo: 'login' },
];
