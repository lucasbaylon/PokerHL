import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Situation } from '../../interfaces/situation';
import { ActiveSituation } from '../../interfaces/active-situation';
import { ActivatedRoute, Router } from '@angular/router';
import { UserParams } from '../../interfaces/user-params';
import { Action } from '../../interfaces/action';
import { CommonService } from './../../services/common.service';
import { NgStyle } from '@angular/common';
import { ActionColorPipe } from '../../pipes/action-color.pipe';
import { DefaultCardsComponent } from '../../components/default-cards/default-cards.component';

@Component({
    selector: 'app-training',
    standalone: true,
    imports: [NgStyle, ActionColorPipe, DefaultCardsComponent],
    templateUrl: './training.component.html',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TrainingComponent {

    countResult: boolean = true;
    GoodResponse: number = 0;
    BadResponse: number = 0;
    TotalResponse: number = 0;
    SuccessRatePercentage: number = 0;
    randomizer: number = 0;
    situationList: Situation[] = [];
    currentSituation!: Situation;
    currentSituationName: string = "";
    activeSituation!: ActiveSituation;
    backgroundColor!: string;
    displaySituation!: boolean;
    hours: number = 1;
    minutes: number = 0;
    seconds: number = 0;
    private countdownInterval: any;
    colorList: any[] = [{name: "heart", color: "red"}, {name: "diamond", color: "red"}, {name: "club", color: "black"}, {name: "spade", color: "black"}];

    tableColors = {
        "green": "rgb(0, 151, 0)",
        "red": "rgb(255, 0, 0)",
        "blue": "#3B82F6"
    }

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private commonService: CommonService
    ) { }

    ngOnInit(): void {
        if (this.activatedRoute.snapshot.params.hasOwnProperty('situationList')) {

            const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
            const tableColor = this.tableColors[userParams.playmatColor];

            this.backgroundColor = tableColor ?
                `radial-gradient(${tableColor}, black 150%)` :
                'radial-gradient(rgb(0, 151, 0), black 150%)';

            if (userParams.cardStyle === 'contrast') {
                this.colorList = [{name: "heart", color: "red"}, {name: "diamond", color: "#3B82F6"}, {name: "club", color: "#009700"}, {name: "spade", color: "black"}];
            }

            this.displaySituation = userParams.displaySituation;

            this.situationList = JSON.parse(this.activatedRoute.snapshot.params['situationList']);
            this.generateSituation();
            const currentUrl = this.router.url;
            const baseUrl = currentUrl.split(';')[0];
            this.router.navigateByUrl(baseUrl);
            this.startCountdown();
        } else {
            this.router.navigate(['situations-list-training']);
        }
    }

    ngOnDestroy() {
        this.clearCountdown();
    }

    filteredActionList(list: Action[], type: string) {
        return list.filter(item => item.type === type).reverse();;
    }

    getRandomSituation(array: any[]): any {
        const randomIndex = Math.floor(Math.random() * array.length);
        return array[randomIndex];
    }

    generateSituation() {
        let situation = this.getRandomSituation(this.situationList);
        this.currentSituation = situation;
        this.currentSituationName = this.currentSituation.name!;
        let situationCase = this.getRandomCase(this.currentSituation.situations);
        let cards = this.generateCards(situationCase);
        this.randomizer = this.generateRandomNumber();
        let result = this.getResultCase(situationCase.action);
        this.activeSituation = {
            nbPlayer: situation.nbPlayer,
            position: situation.position,
            left_card: cards.left_card,
            right_card: cards.right_card,
            actions: situation.actions,
            result: result,
            dealerMissingTokens: situation.dealerMissingTokens,
            opponentLevel: situation.opponentLevel,
            fishPosition: situation.fishPosition
        }
    }

    getFishPosition(mainPlayerPosition: string, fishPlayerPosition: string): string {
        if (mainPlayerPosition === "bu") {
            if (fishPlayerPosition === "sb") {
                return "opponent1";
            } else {
                return "opponent2";
            }
        } else if (mainPlayerPosition === "sb") {
            if (fishPlayerPosition === "bb") {
                return "opponent1";
            } else  {
                return "opponent2";
            }
        } else {
            if (fishPlayerPosition === "bu") {
                return "opponent1";
            } else  {
                return "opponent2";
            }
        }
    }

    getRandomCase(array: any[][]): any {
        const outerArrayIndex = Math.floor(Math.random() * array.length);
        const innerArray = array[outerArrayIndex];
        const innerArrayIndex = Math.floor(Math.random() * innerArray.length);
        return innerArray[innerArrayIndex];
    }

    getRandomColors(num: number): string[] {
        // Vérifiez que le numéro de couleurs est valide (supérieur à 0)
        if (num <= 0) {
            throw new Error('Numéro de couleurs non valide');
        }

        // Créez un tableau vide pour stocker les couleurs aléatoires
        const randomColors: string[] = [];

        // Générez des couleurs aléatoires et ajoutez-les au tableau
        for (let i = 0; i < num; i++) {
            let randomColor;
            do {
                // Générez une couleur aléatoire
                randomColor = this.colorList[Math.floor(Math.random() * this.colorList.length)];
            } while (randomColors.includes(randomColor)); // Vérifiez si la couleur se trouve déjà dans le tableau
            randomColors.push(randomColor); // Ajoutez la couleur au tableau
        }

        // Renvoie le tableau de couleurs aléatoires
        return randomColors;
    }

    generateCards(situationCase: any): any {
        let card = situationCase.card;
        let card_split = card.split('');
        let nbColor = 2;
        if (card_split.length === 3) {
            if (card_split.at(-1) === 's') {
                nbColor = 1;
            }
        }
        let colors = this.getRandomColors(nbColor);
        const leftCardObj = {
            color: "",
            value: ""
        }
        const rightCardObj = {
            color: "",
            value: ""
        }
        if (colors.length === 1) {
            leftCardObj.color = colors[0];
            leftCardObj.value = card_split[0];
            rightCardObj.color = colors[0];
            rightCardObj.value = card_split[1];
        } else if (colors.length === 2) {
            leftCardObj.color = colors[0];
            leftCardObj.value = card_split[0];
            rightCardObj.color = colors[1];
            rightCardObj.value = card_split[1];
        }
        return {
            left_card: leftCardObj,
            right_card: rightCardObj
        }
    }

    getActionFromPercent(percent: number, actions: any): string | undefined {
        let sum = 0;
        for (const action of actions) {
            sum += action.percent;
            if (percent < sum) {
                return action.color;
            }
        }
        return undefined;
    }

    getResultCase(good_action: string): string {
        let action = this.currentSituation.actions.filter(action => action.id === good_action)[0];
        if (action.type === "unique") {
            return action.id;
        } else {
            const action_id = this.getActionFromPercent(this.randomizer, action.colorList);
            return action_id!;
        }
    }

    checkResultCase(result: string) {
        if (this.countResult) this.TotalResponse += 1;
        if (result === this.activeSituation.result) {
            if (this.countResult) this.GoodResponse += 1;
            if (this.countResult) this.SuccessRatePercentage = Math.round((this.GoodResponse / this.TotalResponse) * 100);
            this.countResult = true;
            this.commonService.showSwalToast(`Bonne réponse !`);
            this.generateSituation();
        } else {
            if (this.countResult) this.BadResponse += 1;
            if (this.countResult) this.SuccessRatePercentage = Math.round((this.GoodResponse / this.TotalResponse) * 100);
            const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
            if (userParams.displaySolution) {
                this.countResult = false;
                const modal = document.getElementById('wrong-answer-modal') as HTMLDialogElement;
                if (modal) {
                    modal.showModal();
                }
            } else {
                this.commonService.showSwalToast(`Mauvaise réponse !`, 'error');
                this.generateSituation();
            }
        }
    }

    /**
    * Génère un nombre entier aléatoire entre 0 et 100 inclus.
    * @returns Le nombre entier aléatoire généré.
    */
    generateRandomNumber(): number {
        return Math.floor(Math.random() * 101);
    }

    closeModal() {
        const modal = document.getElementById('wrong-answer-modal') as HTMLDialogElement;
        if (modal) {
            modal.close();
        }
    }

    /**
   * Lance le compte à rebours en décrémentant les heures, minutes et secondes chaque seconde.
   */
    startCountdown() {
        this.countdownInterval = setInterval(() => {
            if (this.seconds > 0) {
                this.seconds--;
            } else if (this.minutes > 0) {
                this.minutes--;
                this.seconds = 59;
            } else if (this.hours > 0) {
                this.hours--;
                this.minutes = 59;
                this.seconds = 59;
            } else {
                this.clearCountdown();
            }
        }, 1000);
    }

    /**
   * Arrête le compte à rebours et efface l'intervalle pour éviter les fuites de mémoire.
   */
    clearCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }

}
