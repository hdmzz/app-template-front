import { Routes } from '@angular/router';
import { authGuard } from '../../guards/auth.guard';

export const routes: Routes = [
  {
    path:'',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path:'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path:'sign-up',
    loadComponent: () => import('./sign-up/sign-up.component').then((m) => m.SignUpComponent),
  },
  {
    path:'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard]
  },
];
