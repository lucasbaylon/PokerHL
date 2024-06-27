import { Routes } from '@angular/router';
import { BaseLayoutComponent } from './components/base-layout/base-layout.component';
import { authGuard } from './guards/auth.guard';
import { checkSituationGuard } from './guards/check-situation.guard';
import { ChangePasswordComponent } from './pages/change-password/change-password.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { SelectTrainingModeComponent } from './pages/select-training-mode/select-training-mode.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { SituationManagerComponent } from './pages/situation-manager/situation-manager.component';
import { SituationsListManagerComponent } from './pages/situations-list-manager/situations-list-manager.component';
import { SituationsListTrainingComponent } from './pages/situations-list-training/situations-list-training.component';
import { TrainingComponent } from './pages/training/training.component';

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
            {
                path: 'select-training-mode',
                component: SelectTrainingModeComponent,
                canActivate: [authGuard]
            },
            {
                path: 'training',
                component: TrainingComponent,
                canActivate: [
                    checkSituationGuard,
                    authGuard
                ]
            }
        ]
    },
    {
        path: 'home',
        component: HomeComponent,
        canActivate: [authGuard]
    },
    {
        path: 'register',
        component: RegisterComponent
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
        path: 'change-password',
        component: ChangePasswordComponent
    }
];
