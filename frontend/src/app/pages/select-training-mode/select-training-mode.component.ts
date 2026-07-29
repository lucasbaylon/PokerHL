import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { AppModalComponent } from '../../components/app-modal/app-modal.component';
import { Situation } from '../../interfaces/situation';

@Component({
    selector: 'app-select-training-mode',
    standalone: true,
    imports: [FormsModule, InputNumberModule, FloatLabelModule, AppModalComponent],
    templateUrl: './select-training-mode.component.html'
})
export class SelectTrainingModeComponent {

    situationList: Situation[] = [];

    heure: number = 0;
    minute: number = 0;
    seconds: number = 10;
    challengeNbSituations: number = 10;
    showTurboTimerModal = false;
    showChallengeModal = false;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute
    ) { }

    /**
     * Initialise le composant et récupère la liste des situations depuis les paramètres de route.
     */
    ngOnInit() {
        if (this.activatedRoute.snapshot.params.hasOwnProperty('situationList')) {
            this.situationList = JSON.parse(this.activatedRoute.snapshot.params['situationList']);
            const currentUrl = this.router.url;
            const baseUrl = currentUrl.split(';')[0];
            this.router.navigateByUrl(baseUrl);
        }
    }

    /**
     * Gère la sélection du mode d'entraînement (infini, turbo, challenge).
     * @param mode Le mode choisi.
     */
    onSelectMode(mode: string) {
        switch (mode) {
            case 'infinite':
                this.router.navigate(['/training', { situationList: JSON.stringify(this.situationList), mode: 'infinite' }]);
                break;
            case 'turbo':
                this.showTurboTimerModal = true;
                break;
            case 'challenge':
                this.showChallengeModal = true;
                break;
            default:
                break;
        }
    }

    /**
     * Lance une session d'entraînement en mode Turbo avec le minuteur configuré.
     */
    startTurboSession() {
        this.router.navigate(['/training', { situationList: JSON.stringify(this.situationList), mode: 'turbo', timer: JSON.stringify({ heure: this.heure, minute: this.minute, seconds: this.seconds }) }]);
    }

    closeTurboTimerModal() {
        this.showTurboTimerModal = false;
    }
    
    /**
     * Lance une session d'entraînement en mode Défi avec le nombre de situations configuré.
     */
    startChallengeSession() {
        this.router.navigate(['/training', { situationList: JSON.stringify(this.situationList), mode: 'challenge', challengeNbSituations: this.challengeNbSituations }]);
    }

    closeChallengeModal() {
        this.showChallengeModal = false;
    }

}
