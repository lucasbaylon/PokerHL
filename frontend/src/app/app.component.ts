import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { AuthService } from './services/auth.service';
import { PrimeNGConfig } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { LoadingComponent } from './components/loading/loading.component';
import { NgParticlesService, NgxParticlesModule } from '@tsparticles/angular';
import { Container, MoveDirection, OutMode } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import { CommonService } from './services/common.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, AsyncPipe, ToastModule, LoadingComponent, NgxParticlesModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {

    id = "tsparticles";

    /* or the classic JavaScript object */
    particlesOptions = {
        fpsLimit: 120,
        particles: {
            color: {
                value: this.commonService.getDarkMode() ? "#ffffff" : "#303030",
            },
            links: {
                color: "#ffffff",
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

    constructor(
        public authService: AuthService,
        private config: PrimeNGConfig,
        private translateService: TranslateService,
        private readonly ngParticlesService: NgParticlesService,
        protected commonService: CommonService) { }

    ngOnInit() {
        this.translateService.addLangs(['fr']);
        this.translateService.setDefaultLang('fr');
        this.translate('fr');

        let theme = localStorage.getItem('theme');
        if (theme !== "dark" && theme !== "light") {
            localStorage.setItem('theme', 'light');
            theme = 'light';
        }
        if (theme === 'dark') document.documentElement.classList.add(theme);
        this.particlesOptions.particles.color.value = theme === 'dark' ? "#ffffff" : "#303030";
        this.particlesOptions.particles.links.color = theme === 'dark' ? "#ffffff" : "#303030";

        this.ngParticlesService.init(async (engine) => {
            await loadSlim(engine);
        });
    }

    translate(lang: string) {
        this.translateService.use(lang);
        this.translateService.get('primeng').subscribe(res => this.config.setTranslation(res));
    }
}
