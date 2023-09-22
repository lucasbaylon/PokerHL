import { HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { SituationManagerComponent } from './pages/situation-manager/situation-manager.component';
import { SituationsListManagerComponent } from './pages/situations-list-manager/situations-list-manager.component';
import { SituationsListTrainingComponent } from './pages/situations-list-training/situations-list-training.component';
import { TrainingComponent } from './pages/training/training.component';
import { ActionColorPipe } from './pipes/action-color.pipe';
import { DealerPipe } from './pipes/dealer.pipe';
import { OpponentLevelPipe } from './pipes/opponent-level.pipe';

import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NgxSliderModule } from 'ngx-slider-v2';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { InputSwitchModule } from 'primeng/inputswitch';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { LoginComponent } from './pages/login/login.component';
import { SettingsComponent } from './pages/settings/settings.component';

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
        ActionColorPipe,
        LoginComponent,
        SettingsComponent
    ],
    imports: [
        FormsModule,
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        AppRoutingModule,
        SweetAlert2Module.forRoot(),
        SocketIoModule.forRoot(config),
        NgxSliderModule,
        TableModule,
        PaginatorModule,
        InputSwitchModule,
        provideFirebaseApp(() => initializeApp({
            apiKey: "AIzaSyB2BrtaN_2h-T0iWEZFe3SZVNhrUxyzYV8",
            authDomain: "pokertraining-ab684.firebaseapp.com",
            projectId: "pokertraining-ab684",
            storageBucket: "pokertraining-ab684.appspot.com",
            messagingSenderId: "812892987669",
            appId: "1:812892987669:web:911a0142ec81c1429b091c"
        })),
        provideAuth(() => getAuth()),
    ],
    providers: [],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
