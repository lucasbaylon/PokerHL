import { Routes } from '@angular/router';
import { BaseLayoutComponent } from './components/base-layout/base-layout.component';
import { authGuard } from './guards/auth.guard';
import { checkSituationGuard } from './guards/check-situation.guard';
import { ChangePasswordComponent } from './pages/change-password/change-password.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RangePageEditorComponent } from './pages/range-page-editor/range-page-editor.component';
import { RangePagesListComponent } from './pages/range-pages-list/range-pages-list.component';
import { LexiconComponent } from './pages/lexicon/lexicon.component';
import { RegisterComponent } from './pages/register/register.component';
import { SelectTrainingModeComponent } from './pages/select-training-mode/select-training-mode.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { SituationManagerComponent } from './pages/situation-manager/situation-manager.component';
import { SituationsListManagerComponent } from './pages/situations-list-manager/situations-list-manager.component';
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
                path: 'situations',
                component: SituationsListManagerComponent,
                canActivate: [authGuard]
            },
            {
                path: 'situations-list-manager',
                redirectTo: 'situations',
                pathMatch: 'full'
            },
            {
                path: 'range-pages',
                component: RangePagesListComponent,
                canActivate: [authGuard]
            },
            {
                path: 'range-page-editor',
                component: RangePageEditorComponent,
                canActivate: [authGuard]
            },
            {
                path: 'situations-list-training',
                redirectTo: 'situations',
                pathMatch: 'full'
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
                path: 'lexique',
                component: LexiconComponent,
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
