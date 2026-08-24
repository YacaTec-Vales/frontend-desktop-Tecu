import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

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
import { Distribuidoras as SucursalDistribuidoras } from './pages/gerente-sucursal/distribuidoras/distribuidoras';
import { Autorizaciones as SucursalAutorizaciones } from './pages/gerente-sucursal/autorizaciones/autorizaciones';
import { Relaciones as SucursalRelaciones } from './pages/gerente-sucursal/relaciones/relaciones';

// Gerente General Layout & Pages
import { LayoutComponent as GerenteGeneralLayout } from './pages/gerente-general/layout/layout.component';
import { CatalogosComponent } from './pages/gerente-general/catalogos/catalogos.component';
import { ConfiguracionComponent } from './pages/gerente-general/configuracion/configuracion.component';
import { AprobacionesComponent as GerenteGeneralAprobaciones } from './pages/gerente-general/aprobaciones/aprobaciones.component';
import { ReportesComponent } from './pages/gerente-general/reportes/reportes.component';
import { CorteQuincenaComponent } from './pages/gerente-general/corte-quincena/corte-quincena.component';
import { Distribuidoras as GeneralDistribuidoras } from './pages/gerente-general/distribuidoras/distribuidoras';
import { Autorizaciones as GeneralAutorizaciones } from './pages/gerente-general/autorizaciones/autorizaciones';
import { Relaciones as GeneralRelaciones } from './pages/gerente-general/relaciones/relaciones';

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
      { path: 'conciliacion', component: ConciliacionComponent },
      { path: 'vales-digitales', component: ValesDigitalesComponent }
    ]
  },
  {
    path: 'gerente-sucursal',
    component: GerenteSucursalLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'plantilla', pathMatch: 'full' },
      { path: 'plantilla', component: PlantillaComponent },
      { path: 'distribuidoras', component: SucursalDistribuidoras },
      { path: 'configuracion', component: SucursalConfiguracion },
      { path: 'aprobaciones', component: SucursalAprobaciones },
      { path: 'autorizaciones', component: SucursalAutorizaciones },
      { path: 'reportes', component: SucursalReportes },
      { path: 'relaciones', component: SucursalRelaciones },
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
      { path: 'distribuidoras', component: GeneralDistribuidoras },
      { path: 'configuracion', component: ConfiguracionComponent },
      { path: 'aprobaciones', component: GerenteGeneralAprobaciones },
      { path: 'autorizaciones', component: GeneralAutorizaciones },
      { path: 'reportes', component: ReportesComponent },
      { path: 'relaciones', component: GeneralRelaciones },
      { path: 'corte-quincena', component: CorteQuincenaComponent }
    ]
  }
];
