import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NgParticlesService, NgxParticlesModule } from '@tsparticles/angular';
import { MoveDirection, OutMode } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import { PrimeNGConfig } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Subscription } from 'rxjs';
import { LoadingComponent } from './components/loading/loading.component';
import { AuthService } from './services/auth.service';
import { CommonService } from './services/common.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, AsyncPipe, ToastModule, LoadingComponent, NgxParticlesModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {

    particlesId = "tsparticles";

    particlesOptions: any;
    darkModeSubscription!: Subscription;

    constructor(
        public authService: AuthService,
        private config: PrimeNGConfig,
        private translateService: TranslateService,
        private readonly ngParticlesService: NgParticlesService,
        protected commonService: CommonService
    ) {
        this.updateParticlesOptions(this.commonService.getDarkMode());
    }

    ngOnInit() {
        this.translateService.addLangs(['fr']);
        this.translateService.setDefaultLang('fr');
        this.translate('fr');

        let theme = localStorage.getItem('theme');
        if (theme !== "dark" && theme !== "light") {
            localStorage.setItem('theme', 'light');
            theme = 'light';
        }
        if (theme === 'dark') {
            document.documentElement.classList.add(theme);
            this.commonService.setDarkMode(true);
        } else {
            this.commonService.setDarkMode(false);
        }

        this.ngParticlesService.init(async (engine) => {
            await loadSlim(engine);
        });

        this.darkModeSubscription = this.commonService.darkMode$.subscribe(isDarkMode => {
            this.updateParticlesOptions(isDarkMode);
        });
    }

    ngOnDestroy() {
        if (this.darkModeSubscription) {
            this.darkModeSubscription.unsubscribe();
        }
    }

    translate(lang: string) {
        this.translateService.use(lang);
        this.translateService.get('primeng').subscribe(res => this.config.setTranslation(res));
    }

    test() {
        console.log(this.commonService.getDarkMode());
        console.log(this.particlesOptions.particles.color);
        console.log(this.particlesOptions.particles.links);
    }

    updateParticlesOptions(isDarkMode: boolean) {
        this.particlesOptions = {
            fpsLimit: 120,
            particles: {
                color: {
                    value: isDarkMode ? "#ffffff" : "#303030",
                },
                links: {
                    color: isDarkMode ? "#ffffff" : "#303030",
                    distance: 300,
                    enable: true,
                    opacity: 0.4,
                    width: 1,
                },
                move: {
                    direction: MoveDirection.none,
                    enable: true,
                    outModes: {
                        default: OutMode.bounce,
                    },
                    random: false,
                    speed: 0.4,
                    straight: false,
                    attract: {
                        enable: true,
                        rotateX: 600,
                        rotateY: 1200
                    }
                },
                number: {
                    density: {
                        enable: false,
                        area: 600,
                    },
                    value: 30,
                },
                opacity: {
                    value: 0.5,
                },
                shape: {
                    type: "circle",
                    stroke: {
                        color: "#000000",
                        width: 0
                    },
                    polygon: {
                        nb_sides: 5
                    }
                },
                size: {
                    value: 4
                },
            },
            detectRetina: true,
        };
    }
}
