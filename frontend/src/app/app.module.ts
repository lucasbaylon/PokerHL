import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { TrainingComponent } from './pages/training/training.component';
import { SituationManagerComponent } from './pages/situation-manager/situation-manager.component';
import { SituationsListManagerComponent } from './pages/situations-list-manager/situations-list-manager.component';
import { SituationsListTrainingComponent } from './pages/situations-list-training/situations-list-training.component';
import { DealerPipe } from './pipes/dealer.pipe';
import { OpponentLevelPipe } from './pipes/opponent-level.pipe';

import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { NgxSliderModule } from 'ngx-slider-v2';
import { ActionColorPipe } from './pipes/action-color.pipe';

const config: SocketIoConfig = { url: 'http://localhost:3000', options: {} };

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        TrainingComponent,
        SituationManagerComponent,
        SituationsListManagerComponent,
        SituationsListTrainingComponent,
        DealerPipe,
        OpponentLevelPipe,
        ActionColorPipe
    ],
    imports: [
        FormsModule,
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        AppRoutingModule,
        SweetAlert2Module.forRoot(),
        SocketIoModule.forRoot(config),
        NgxSliderModule
    ],
    providers: [],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
