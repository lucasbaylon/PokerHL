import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { SituationsComponent } from './components/situations/situations.component';
import { TrainingComponent } from './components/training/training.component';

import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { ActionColorPipe } from './pipe/action-color.pipe';

import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { SituationListComponent } from './components/situation-list/situation-list.component';
import { ManageSituationComponent } from './components/manage-situation/manage-situation.component';
import { DealerPipe } from './pipe/dealer.pipe';
import { OpponentLevelPipe } from './pipe/opponent-level.pipe';
import { MatMenuModule } from '@angular/material/menu';
import { TestComponent } from './test/test.component';

const config: SocketIoConfig = { url: 'http://localhost:3000', options: {} };

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        SituationsComponent,
        TrainingComponent,
        ActionColorPipe,
        SituationListComponent,
        ManageSituationComponent,
        DealerPipe,
        OpponentLevelPipe,
        TestComponent
    ],
    imports: [
        FormsModule,
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        AppRoutingModule,
        SweetAlert2Module,
        SocketIoModule.forRoot(config),
        NgxSliderModule,
        MatMenuModule
    ],
    providers: [],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
