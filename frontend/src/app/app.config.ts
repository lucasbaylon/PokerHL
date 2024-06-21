import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { appInterceptor } from './interceptors/app.interceptor';

const config: SocketIoConfig = { url: environment.socketUrl, options: {} };

export function HttpLoaderFactory(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(
            withInterceptors([appInterceptor])
        ),
        provideAnimations(),
        importProvidersFrom(TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
        })),
        provideFirebaseApp(() => initializeApp({
            apiKey: "AIzaSyB2BrtaN_2h-T0iWEZFe3SZVNhrUxyzYV8",
            authDomain: "pokertraining-ab684.firebaseapp.com",
            projectId: "pokertraining-ab684",
            storageBucket: "pokertraining-ab684.appspot.com",
            messagingSenderId: "812892987669",
            appId: "1:812892987669:web:911a0142ec81c1429b091c"
        })),
        provideStorage(() => getStorage()),
        provideAuth(() => getAuth()),
        importProvidersFrom(SocketIoModule.forRoot(config)),
    ]
};
