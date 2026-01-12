import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { pendingGuard } from './guards/pending.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/app/papers',
    pathMatch: 'full'
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'pending',
    loadComponent: () => import('./pages/pending/pending.component').then(m => m.PendingComponent),
    canActivate: [pendingGuard]
  },
  {
    path: 'app',
    canActivate: [authGuard],
    children: [
      {
        path: 'papers',
        loadComponent: () => import('./pages/papers/papers.component').then(m => m.PapersComponent)
      },
      {
        path: 'papers/:id',
        loadComponent: () => import('./pages/paper-detail/paper-detail.component').then(m => m.PaperDetailComponent)
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./pages/admin-users/admin-users.component').then(m => m.AdminUsersComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'admin/tags',
        loadComponent: () => import('./pages/admin-tags/admin-tags.component').then(m => m.AdminTagsComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'admin/threat-models',
        loadComponent: () => import('./pages/admin-threat-models/admin-threat-models.component').then(m => m.AdminThreatModelsComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'admin/settings',
        loadComponent: () => import('./pages/admin-settings/admin-settings.component').then(m => m.AdminSettingsComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'tools/paper-finder',
        loadComponent: () => import('./pages/admin-paper-finder/admin-paper-finder.component').then(m => m.AdminPaperFinderComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/user-settings/user-settings.component').then(m => m.UserSettingsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/app/papers'
  }
];
