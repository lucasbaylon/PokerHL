import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonService } from '../../services/common.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { Container, MoveDirection, OutMode } from '@tsparticles/engine';
import { NgParticlesService, NgxParticlesModule } from '@tsparticles/angular';
import { loadSlim } from '@tsparticles/slim';

@Component({
    selector: 'app-base-layout',
    standalone: true,
    imports: [RouterOutlet, NgClass, SidebarComponent, NgxParticlesModule],
    templateUrl: './base-layout.component.html',
})
export class BaseLayoutComponent {

    id = "tsparticles";

    /* or the classic JavaScript object */
    particlesOptions = {
        fpsLimit: 120,
        interactivity: {
            events: {
                onClick: {
                    enable: true,
                    mode: "push",
                },
                onHover: {
                    enable: true,
                    mode: "repulse",
                }
            },
            modes: {
                push: {
                    quantity: 4,
                },
                repulse: {
                    distance: 200,
                    duration: 0.4,
                },
            },
        },
        particles: {
            color: {
                value: "#ffffff",
            },
            links: {
                color: "#ffffff",
                distance: 150,
                enable: true,
                opacity: 0.5,
                width: 1,
            },
            move: {
                direction: MoveDirection.none,
                enable: true,
                outModes: {
                    default: OutMode.bounce,
                },
                random: false,
                speed: 6,
                straight: false,
            },
            number: {
                density: {
                    enable: true,
                    area: 800,
                },
                value: 80,
            },
            opacity: {
                value: 0.5,
            },
            shape: {
                type: "circle",
            },
            size: {
                value: { min: 1, max: 5 },
            },
        },
        detectRetina: true,
    };

    constructor(
        protected commonService: CommonService,
        private readonly ngParticlesService: NgParticlesService
    ) { }

    ngOnInit(): void {
        this.ngParticlesService.init(async (engine) => {
            console.log(engine);
            await loadSlim(engine);
        });
    }

    particlesLoaded(container: Container): void {
        console.log(container);
    }

}
