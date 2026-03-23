import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { roleGuard } from './guards/role.guard';
import { AdminComponent } from './pages/admin/admin.component';
import { CartComponent } from './pages/cart/cart.component';
import { CatalogComponent } from './pages/catalog/catalog.component';
import { LoginComponent } from './pages/login/login.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { ReportsComponent } from './pages/reports/reports.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'catalog', component: CatalogComponent, canActivate: [authGuard] },
  {
    path: 'cart',
    component: CartComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['user'] },
  },
  {
    path: 'orders',
    component: OrdersComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['user'] },
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'reports',
    component: ReportsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },
  { path: '**', redirectTo: 'login' },
];
