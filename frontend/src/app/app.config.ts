import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { MessageService } from 'primeng/api';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { environment } from '../environments/environment';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { appInterceptor } from './interceptors/app.interceptor';

const config: SocketIoConfig = { url: environment.socketUrl, options: {} };

export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideFirebaseApp(() => initializeApp({
            apiKey: "AIzaSyB2BrtaN_2h-T0iWEZFe3SZVNhrUxyzYV8",
            authDomain: "pokertraining-ab684.firebaseapp.com",
            projectId: "pokertraining-ab684",
            storageBucket: "pokertraining-ab684.appspot.com",
            messagingSenderId: "812892987669",
            appId: "1:812892987669:web:911a0142ec81c1429b091c"
        })),
        provideAuth(() => getAuth()),
        MessageService,
        provideAnimations(),
        provideHttpClient(withInterceptors([appInterceptor])),
        importProvidersFrom(TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
        })),
        importProvidersFrom(SocketIoModule.forRoot(config)),
        // importProvidersFrom({ provide: HTTP_INTERCEPTORS, useClass: appInterceptor, multi: true })
    ]
};
