import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ManageSituationComponent } from './components/manage-situation/manage-situation.component';
import { SituationListComponent } from './components/situation-list/situation-list.component';
import { SituationsComponent } from './components/situations/situations.component';
import { TrainingComponent } from './components/training/training.component';
import { CheckSituationGuard } from './guards/check-situation.guard';

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
        path: 'situations',
        component: SituationsComponent
    },
    {
        path: 'manage',
        component: ManageSituationComponent
    },
    {
        path: 'list',
        component: SituationListComponent
    },
    {
        path: 'training',
        component: TrainingComponent,
        canActivate: [
            CheckSituationGuard
        ]
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
