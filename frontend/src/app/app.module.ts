import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { TrainingComponent } from './pages/training/training.component';
import { SituationManagerComponent } from './pages/situation-manager/situation-manager.component';
import { SituationsListManagerComponent } from './pages/situations-list-manager/situations-list-manager.component';
import { SituationsListTrainingComponent } from './pages/situations-list-training/situations-list-training.component';

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        TrainingComponent,
        SituationManagerComponent,
        SituationsListManagerComponent,
        SituationsListTrainingComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule
    ],
    providers: [],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
