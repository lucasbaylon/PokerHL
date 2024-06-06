import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PrimeNGConfig } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './services/auth.service';
import { ToastModule } from 'primeng/toast';
import { LoadingComponent } from './components/loading/loading.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, ToastModule, LoadingComponent, AsyncPipe],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {

    constructor(public authService: AuthService, private config: PrimeNGConfig, private translateService: TranslateService) { }

    ngOnInit() {
        this.translateService.addLangs(['fr']);
        this.translateService.setDefaultLang('fr');
        this.translate('fr');
    }

    translate(lang: string) {
        this.translateService.use(lang);
        this.translateService.get('primeng').subscribe(res => this.config.setTranslation(res));
    }
}
