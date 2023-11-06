import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { TrainingComponent } from './pages/training/training.component';
import { SituationManagerComponent } from './pages/situation-manager/situation-manager.component';
import { SituationsListManagerComponent } from './pages/situations-list-manager/situations-list-manager.component';
import { SituationsListTrainingComponent } from './pages/situations-list-training/situations-list-training.component';
import { checkSituationGuard } from './guards/check-situation.guard';
import { AuthGuard } from './guards/auth.guard';
import { BaseLayoutComponent } from './components/base-layout/base-layout.component';
const routes: Routes = [
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
                canActivate: [AuthGuard]
            },
            {
                path: 'situations-manager',
                component: SituationManagerComponent,
                canActivate: [AuthGuard]
            },
            {
                path: 'situations-list-manager',
                component: SituationsListManagerComponent,
                canActivate: [AuthGuard]
            },
            {
                path: 'situations-list-training',
                component: SituationsListTrainingComponent,
                canActivate: [
                    AuthGuard,
                    checkSituationGuard
                ]
            },
        ]
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'settings',
        component: SettingsComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'training',
        component: TrainingComponent,
        canActivate: [
            checkSituationGuard
        ]
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
