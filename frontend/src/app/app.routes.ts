import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AdminViewComponent } from './components/admin-view/admin-view.component';
import { UserViewComponent } from './components/user-view/user-view.component';
import { QrRequestComponent } from './components/qr-request/qr-request.component';
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'request/:id', component: QrRequestComponent },
  { 
    path: 'admin', 
    component: AdminViewComponent, 
    canActivate: [roleGuard],
    data: { role: 'admin' }
  },
  { 
    path: 'user', 
    component: UserViewComponent, 
    canActivate: [roleGuard],
    data: { role: 'user' }
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
