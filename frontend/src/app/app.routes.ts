import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { authGuard } from './guards/auth.guard';
import { SettingsComponent } from './pages/settings/settings.component';
import { SituationManagerComponent } from './pages/situation-manager/situation-manager.component';
import { SituationsListManagerComponent } from './pages/situations-list-manager/situations-list-manager.component';
import { SituationsListTrainingComponent } from './pages/situations-list-training/situations-list-training.component';
import { TrainingComponent } from './pages/training/training.component';
import { checkSituationGuard } from './guards/check-situation.guard';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { BaseLayoutComponent } from './components/base-layout/base-layout.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: '',
        component: BaseLayoutComponent,
        children: [
            {
                path: 'situations-manager',
                component: SituationManagerComponent,
                canActivate: [authGuard]
            },
            {
                path: 'situations-list-manager',
                component: SituationsListManagerComponent,
                canActivate: [authGuard]
            },
            {
                path: 'situations-list-training',
                component: SituationsListTrainingComponent,
                canActivate: [
                    authGuard,
                    checkSituationGuard
                ]
            },
            {
                path: 'settings',
                component: SettingsComponent,
                canActivate: [authGuard]
            },
        ]
    },
    {
        path: 'home',
        component: HomeComponent,
        canActivate: [authGuard]
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'forgot-password',
        component: ForgotPasswordComponent
    },
    {
        path: 'training',
        component: TrainingComponent,
        canActivate: [
            checkSituationGuard,
            authGuard
        ]
    }
];
