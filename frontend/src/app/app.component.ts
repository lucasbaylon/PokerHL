import { AsyncPipe } from '@angular/common';
import { Component, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NgParticlesService, NgxParticlesModule } from '@tsparticles/angular';
import { MoveDirection, OutMode } from '@tsparticles/engine';
import type { Container } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import { PrimeNGConfig } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { LoadingComponent } from './components/loading/loading.component';
import { ParticleSettings } from './interfaces/user-params';
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

    id = "tsparticles";
    private particlesContainer?: Container;

    /* or the classic JavaScript object */
    particlesOptions = this.createParticlesOptions(this.commonService.getDarkMode(), this.commonService.getParticleSettings());

    private createParticlesOptions(isDark: boolean, particleSettings: ParticleSettings) {
        const color = isDark ? "#e5e5e5" : "#303030";

        return {
            fpsLimit: 120,
            particles: {
                color: {
                    value: color,
                },
                links: {
                    color: color,
                    distance: 300,
                    enable: particleSettings.particleLinks,
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
                    speed: particleSettings.particleSpeed,
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
                    value: particleSettings.particleCount,
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
                    value: particleSettings.particleSize
                }
            },
            detectRetina: true,
        };
    }

    constructor(
        public authService: AuthService,
        private config: PrimeNGConfig,
        private translateService: TranslateService,
        private readonly ngParticlesService: NgParticlesService,
        protected commonService: CommonService) {
        
        effect(() => {
            const isDark = this.commonService.getDarkMode();
            const particleSettings = this.commonService.getParticleSettings();
            
            // On applique le thème à l'élément racine
            const htmlElement = document.documentElement;
            if (isDark) {
                htmlElement.classList.add('dark');
            } else {
                htmlElement.classList.remove('dark');
            }

            // On met à jour les options
            this.particlesOptions = this.createParticlesOptions(isDark, particleSettings);
            void this.particlesContainer?.reset(this.particlesOptions);
        });
    }

    /**
     * Initialise la configuration de l'application (langue, thème, particules).
     */
    ngOnInit() {
        this.translateService.addLangs(['fr']);
        this.translateService.setDefaultLang('fr');
        this.translate('fr');

        this.ngParticlesService.init(async (engine) => {
            await loadSlim(engine);
        });
    }

    /**
     * Applique la langue choisie et met à jour la configuration PrimeNG.
     * @param lang Code de la langue (ex: 'fr').
     */
    translate(lang: string) {
        this.translateService.use(lang);
        this.translateService.get('primeng').subscribe(res => this.config.setTranslation(res));
    }

    particlesLoaded(container: Container): void {
        this.particlesContainer = container;
    }
}
