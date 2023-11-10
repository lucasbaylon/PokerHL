import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Action } from 'src/app/interfaces/action';
import { ActiveSituation } from 'src/app/interfaces/active-situation';
import { Situation } from 'src/app/interfaces/situation';
import { UserParams } from 'src/app/interfaces/user-params';
import { SituationService } from 'src/app/services/situation.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-training',
    templateUrl: './training.component.html',
    styleUrls: ['./training.component.scss']
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

    colorList: string[] = ["Hearts", "Diamonds", "Clubs", "Spades"];

    tableColors = {
        "green": "rgb(0, 151, 0)",
        "red": "rgb(255, 0, 0)",
        "blue": "#3B82F6"
    }

    backgroundColor!: string;

    cardStyle!: string;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute
    ) { }

    ngOnInit(): void {
        if (this.activatedRoute.snapshot.params.hasOwnProperty('situationList')) {

            const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
            const tableColor = this.tableColors[userParams.playmatColor];

            this.backgroundColor = tableColor ?
                `radial-gradient(${tableColor}, black 150%)` :
                'radial-gradient(rgb(0, 151, 0), black 150%)';

            this.cardStyle = userParams.cardStyle;

            this.situationList = JSON.parse(this.activatedRoute.snapshot.params['situationList']);
            this.generateSituation();
            const currentUrl = this.router.url;
            const baseUrl = currentUrl.split(';')[0];
            this.router.navigateByUrl(baseUrl);
        } else {
            this.router.navigate(['situations-list-training']);
        }
    }

    filteredActionList(list: Action[], type: string) {
        return list.filter(item => item.type === type);
    }

    getRandomSituation(array: any[]): any {
        const randomIndex = Math.floor(Math.random() * array.length);
        return array[randomIndex];
    }

    redirectTo(page: string) {
        this.router.navigate([page]);
    }

    generateSituation() {
        let situation = this.getRandomSituation(this.situationList);
        this.currentSituation = situation;
        this.currentSituationName = this.currentSituation.name!;
        let situationCase = this.getRandomCase(this.currentSituation.situations)
        let cards = this.generateCards(situationCase);
        this.randomizer = this.generateRandomNumber();
        let result = this.getResultCase(situationCase.action);
        this.activeSituation = {
            nbPlayer: situation.nbPlayer,
            dealer: situation.dealer,
            left_card: cards.left_card,
            right_card: cards.right_card,
            actions: situation.actions,
            result: result,
            dealerMissingTokens: situation.dealerMissingTokens,
            opponentLevel: situation.opponentLevel
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
        let left_card;
        let right_card;
        let card = situationCase.card;
        let card_split = card.split('');
        let nbColor = 2;
        if (card_split.length === 3) {
            if (card_split.at(-1) === 's') {
                nbColor = 1;
            }
        }
        let colors = this.getRandomColors(nbColor);
        if (colors.length === 1) {
            left_card = `${card_split[0]}_${colors[0]}`;
            right_card = `${card_split[1]}_${colors[0]}`;
        } else if (colors.length === 2) {
            left_card = `${card_split[0]}_${colors[0]}`;
            right_card = `${card_split[1]}_${colors[1]}`;
        }
        return {
            left_card: left_card,
            right_card: right_card
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
            Swal.fire({
                position: 'top-end',
                toast: true,
                icon: 'success',
                title: '<span style="font-size: 1.3vw;">Bonne réponse !</span>',
                showConfirmButton: false,
                width: '16vw',
                timer: 2500
            });
            this.generateSituation();
        } else {
            if (this.countResult) this.BadResponse += 1;
            if (this.countResult) this.SuccessRatePercentage = Math.round((this.GoodResponse / this.TotalResponse) * 100);
            const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
            if (userParams.displaySolution) {
                this.countResult = false;
                let situationTable = document.getElementById("error-window-container");
                situationTable!.style.display = "block";
                let uniqueActionList = this.activeSituation.actions.filter(action => action.type === "unique");
                uniqueActionList.map(action => {
                    let button = document.getElementById(`button_${action.id}`) as HTMLButtonElement;
                    button!.classList.remove("fill");
                    button.disabled = true;
                });
            } else {
                Swal.fire({
                    position: 'top-end',
                    toast: true,
                    icon: 'error',
                    title: '<span style="font-size: 1.3vw;">Mauvaise réponse !</span>',
                    showConfirmButton: false,
                    width: '17.7vw',
                    timer: 2500
                });
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

    closeErrorWindow() {
        document.getElementById("error-window-container")!.style.display = "none";
        let uniqueActionList = this.activeSituation.actions.filter(action => action.type === "unique");
        uniqueActionList.map(action => {
            let button = document.getElementById(`button_${action.id}`) as HTMLButtonElement;
            button!.classList.add("fill");
            button.disabled = false;
        })
    }

}
