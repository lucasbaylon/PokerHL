import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { BaseLayoutComponent } from './components/base-layout/base-layout.component';
import { HomeComponent } from './pages/home/home.component';
import { authGuard } from './guards/auth.guard';
import { SettingsComponent } from './pages/settings/settings.component';

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
                path: 'home',
                component: HomeComponent,
                canActivate: [authGuard]
            },
            // {
            //     path: 'situations-manager',
            //     component: SituationManagerComponent,
            //     canActivate: [AuthGuard]
            // },
            // {
            //     path: 'situations-list-manager',
            //     component: SituationsListManagerComponent,
            //     canActivate: [AuthGuard]
            // },
            // {
            //     path: 'situations-list-training',
            //     component: SituationsListTrainingComponent,
            //     canActivate: [
            //         AuthGuard,
            //         checkSituationGuard
            //     ]
            // },
            {
                path: 'settings',
                component: SettingsComponent,
                canActivate: [authGuard]
            },
            {
                path: 'login',
                component: LoginComponent
            }
        ]
    },
    // {
    //     path: 'training',
    //     component: TrainingComponent,
    //     canActivate: [
    //         checkSituationGuard
    //     ]
    // }
];
