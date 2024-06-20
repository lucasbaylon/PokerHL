import { NgStyle } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CardComponent } from '../../components/card/card.component';
import { DefaultCardsComponent } from '../../components/default-cards/default-cards.component';
import { ActiveSituation, TableCard, TableColorCard, TableColorCardObj } from '../../interfaces/active-situation';
import { Card } from '../../interfaces/card';
import { Situation } from '../../interfaces/situation';
import { Solution } from '../../interfaces/solution';
import { UserParams } from '../../interfaces/user-params';
import { SolutionColorPipe } from '../../pipes/solution-color.pipe';
import { CommonService } from './../../services/common.service';

@Component({
    selector: 'app-training',
    standalone: true,
    imports: [NgStyle, SolutionColorPipe, DefaultCardsComponent, CardComponent],
    templateUrl: './training.component.html'
})
export class TrainingComponent {

    countResult: boolean = true;
    goodResponse: number = 0;
    badResponse: number = 0;
    totalResponse: number = 0;
    successRatePercentage: number = 0;
    situationList: Situation[] = [];
    currentSituation!: Situation;
    currentSituationName: string = "";
    activeSituation!: ActiveSituation;
    backgroundColor!: string;
    hours: number = 1;
    minutes: number = 0;
    seconds: number = 0;
    private countdownInterval: any;
    colorList: any[] = [{ name: "heart", color: "red" }, { name: "diamond", color: "red" }, { name: "club", color: "black" }, { name: "spade", color: "black" }];

    tableColors = {
        "green": "rgb(0, 151, 0)",
        "red": "rgb(255, 0, 0)",
        "blue": "#3B82F6"
    }

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        protected commonService: CommonService
    ) { }

    ngOnInit(): void {
        if (this.activatedRoute.snapshot.params.hasOwnProperty('situationList')) {

            const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
            const tableColor = this.tableColors[userParams.playmatColor];

            this.backgroundColor = tableColor ?
                `radial-gradient(${tableColor}, black 150%)` :
                'radial-gradient(rgb(0, 151, 0), black 150%)';

            if (userParams.cardStyle === 'contrast') {
                this.colorList = [{ name: "heart", color: "#d20000" }, { name: "diamond", color: "#3B82F6" }, { name: "club", color: "#009700" }, { name: "spade", color: "black" }];
            }

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

    ngAfterViewInit() {
        if (window.innerHeight >= 1080) {
            document.getElementById("poker-table-div")?.classList.add("scale-125");
        }
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        const div = document.getElementById("poker-table-div")!;
        if (event.target.innerHeight > 1080) {
            div.classList.add("scale-125");
        } else {
            div.classList.remove("scale-125");
        }
    }

    filteredSolutionLst(solutionLst: Solution[], type: string) {
        return solutionLst.filter(solution => solution.type === type).reverse();;
    }

    getRandomSituation(situationLst: Situation[]): Situation {
        const randomIndex = Math.floor(Math.random() * situationLst.length);
        return situationLst[randomIndex];
    }

    generateSituation() {
        let situation = this.getRandomSituation(this.situationList);
        this.currentSituation = situation;
        this.currentSituationName = this.currentSituation.name!;
        let situationCase = this.getRandomCase(this.currentSituation.situations);
        let cards = this.generateCards(situationCase);
        let result = this.getResultCase(situationCase.solution!);
        this.activeSituation = {
            nbPlayer: situation.nbPlayer!,
            position: situation.position,
            leftCard: cards.leftCard,
            rightCard: cards.rightCard,
            solutions: situation.solutions,
            result: result,
            stack: situation.stack,
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
            } else {
                return "opponent2";
            }
        } else {
            if (fishPlayerPosition === "bu") {
                return "opponent1";
            } else {
                return "opponent2";
            }
        }
    }

    getRandomCase(array: Card[][]): Card {
        const outerArrayIndex = Math.floor(Math.random() * array.length);
        const innerArray = array[outerArrayIndex];
        const innerArrayIndex = Math.floor(Math.random() * innerArray.length);
        return innerArray[innerArrayIndex];
    }

    getRandomColors(num: number): TableColorCardObj[] {
        // Vérifiez que le numéro de couleurs est valide (supérieur à 0)
        if (num <= 0) {
            throw new Error('Numéro de couleurs non valide');
        }

        // Créez un tableau vide pour stocker les couleurs aléatoires
        const randomColors: TableColorCardObj[] = [];

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

    generateCards(situationCase: Card): TableCard {
        const card = situationCase.card;
        const card_split = card.split('');
        const nbColor = (card_split.length === 3 && card_split.at(-1) === 's') ? 1 : 2;
        const colors = this.getRandomColors(nbColor);

        const defaultColorCardObj: TableColorCardObj = { name: 'default', color: 'default' };

        const leftCardObj: TableColorCard = {
            color: defaultColorCardObj,
            value: card_split[0]
        };

        const rightCardObj: TableColorCard = {
            color: defaultColorCardObj,
            value: card_split[1]
        };

        if (colors.length === 1) {
            leftCardObj.color = colors[0];
            rightCardObj.color = colors[0];
        } else if (colors.length === 2) {
            leftCardObj.color = colors[0];
            rightCardObj.color = colors[1];
        }

        return {
            leftCard: leftCardObj,
            rightCard: rightCardObj
        };
    }

    getResultCase(good_solution: string): string[] {
        let solution = this.currentSituation.solutions.filter(solution => solution.id === good_solution)[0];
        if (solution.type === "unique") {
            return [solution.id];
        } else {
            return solution.colorList!.map(color => color.color);
        }
    }

    checkResultCase(result: string) {
        if (this.countResult) this.totalResponse += 1;
        if (this.activeSituation.result.includes(result)) {
            if (this.countResult) {
                this.goodResponse += 1;
                this.successRatePercentage = Math.round((this.goodResponse / this.totalResponse) * 100);
            }
            this.countResult = true;
            this.commonService.showSwalToast(`Bonne réponse !`);
            this.generateSituation();
        } else {
            if (this.countResult) {
                this.badResponse += 1;
                this.successRatePercentage = Math.round((this.goodResponse / this.totalResponse) * 100);
            }
            const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
            if (userParams.displaySolution) {
                this.commonService.showModal('wrong-answer-modal');
            } else {
                this.commonService.showSwalToast(`Mauvaise réponse !`, 'error');
                this.countResult = false;
            }
        }
    }

    closeSolutionModal() {
        this.commonService.closeModal('wrong-answer-modal');
        this.generateSituation();
    }

    /**
    * Génère un nombre entier aléatoire entre 0 et 100 inclus.
    * @returns Le nombre entier aléatoire généré.
    */
    generateRandomNumber(): number {
        return Math.floor(Math.random() * 101);
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
