import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActiveSituation } from 'src/app/interfaces/active-situation';
import { Situation } from 'src/app/interfaces/situation';
import { SituationService } from 'src/app/services/situation.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-training',
    templateUrl: './training.component.html',
    styleUrls: ['./training.component.scss']
})
export class TrainingComponent implements OnInit {

    // loading: boolean = true;

    situationList: Situation[] = [];

    currentSituation!: Situation;

    activeSituation!: ActiveSituation;

    colorList: string[] = ["Hearts", "Diamonds", "Clubs", "Spades"]

    constructor(
        private apiSituation: SituationService,
        private router: Router,
        private _Activatedroute: ActivatedRoute
    ) { }

    ngOnInit(): void {
        Swal.fire({
            title: 'Chargement des situations en cours...',
            showCancelButton: false,
            showConfirmButton: false,
            confirmButtonColor: '#303030'
        });
        Swal.showLoading();

        let situationList: Situation[] = this._Activatedroute.snapshot.params["situationList"];

        this.apiSituation.situationsForTraining.subscribe(data => {
            Swal.close();
            this.situationList = data;
            this.generateSituation();
        });

        this.apiSituation.getSituationsForTraining(situationList);
    }

    getRandomSituation(array: any[]): any {
        const randomIndex = Math.floor(Math.random() * array.length);
        return array[randomIndex];
    }

    redirectToList() {
        this.router.navigate(['list']);
    }

    generateSituation() {
        let situation = this.getRandomSituation(this.situationList);
        this.currentSituation = situation;
        console.log(this.currentSituation);
        let situationCase = this.getRandomCase(this.currentSituation.situations)
        let cards = this.generateCards(situationCase);
        this.activeSituation = {
            nbPlayer: situation.nbPlayer,
            dealer: situation.dealer,
            left_card: cards.left_card,
            right_card: cards.right_card,
            actions: situation.actions,
            result: situationCase.action
        }
        console.log(this.activeSituation)
    }

    getRandomCase(array: any[][]): any {
        const outerArrayIndex = Math.floor(Math.random() * array.length);
        const innerArray = array[outerArrayIndex];
        const innerArrayIndex = Math.floor(Math.random() * innerArray.length);
        return innerArray[innerArrayIndex];
    }

    getRandomColors(num: number): string[] {
        // Vérifiez que le numéro de couleurs est valide (supérieur à 0)
        if (num <= 0 || num >= 4) {
            throw new Error('Numéro de couleurs non valide');
        }

        // Créez un tableau vide pour stocker les couleurs aléatoires
        const randomColors = [];

        // Générez des couleurs aléatoires et ajoutez-les au tableau
        for (let i = 0; i < num; i++) {
            randomColors.push(this.colorList[Math.floor(Math.random() * 4)]);
        }

        // Renvoie le tableau de couleurs aléatoires
        return randomColors;
    }

    generateCards(situationCase: any): any {
        console.log(situationCase)
        let left_card;
        let right_card;
        let card = situationCase.card;
        let card_split = card.split('')
        let nbColor = 2;
        if (card_split.length === 3) {
            if (card_split.at(-1) === 's') {
                nbColor = 1;
            }
        }
        let colors = this.getRandomColors(nbColor);
        if(colors.length === 1) {
            left_card = `${card_split[0]}_${colors[0]}`;
            right_card = `${card_split[1]}_${colors[0]}`;
        } else if(colors.length === 2) {
            left_card = `${card_split[0]}_${colors[0]}`;
            right_card = `${card_split[1]}_${colors[1]}`;
        }
        return {
            left_card: left_card,
            right_card: right_card
        }
    }

    getResultCase(result: string) {
        if (result === this.activeSituation.result) {
            console.log("BRAVO !!!!!!")
        } else {
            console.log("NUL")
        }
    }

}
