import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { LoginComponent } from './pages/login/login.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { AppInterceptor } from './interceptors/app.interceptor';
import { LoadingComponent } from './components/loading/loading.component';
import { AuthService } from './services/auth.service';

import { environment } from '../environments/environment';
import { BaseLayoutComponent } from './components/base-layout/base-layout.component';

const config: SocketIoConfig = { url: environment.socketUrl, options: {} };

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
        SettingsComponent,
        LoadingComponent,
        BaseLayoutComponent
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
        DropdownModule,
        InputNumberModule,
        ToastModule,
        provideFirebaseApp(() => initializeApp({
            apiKey: "AIzaSyB2BrtaN_2h-T0iWEZFe3SZVNhrUxyzYV8",
            authDomain: "pokertraining-ab684.firebaseapp.com",
            projectId: "pokertraining-ab684",
            storageBucket: "pokertraining-ab684.appspot.com",
            messagingSenderId: "812892987669",
            appId: "1:812892987669:web:911a0142ec81c1429b091c"
        })),
        provideAuth(() => getAuth())
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: AppInterceptor, multi: true },
        MessageService,
        AuthService
    ],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
