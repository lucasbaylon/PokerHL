import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
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
