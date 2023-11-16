import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { PrimeNGConfig } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
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
