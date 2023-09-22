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

const routes: Routes = [
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    },
    {
        path: 'home',
        component: HomeComponent
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'settings',
        component: SettingsComponent
    },
    {
        path: 'situations-manager',
        component: SituationManagerComponent
    },
    {
        path: 'situations-list-manager',
        component: SituationsListManagerComponent
    },
    {
        path: 'situations-list-training',
        component: SituationsListTrainingComponent,
        canActivate: [
            checkSituationGuard
        ]
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
