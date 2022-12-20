import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Situation } from 'src/app/interfaces/situation';
import { CommonService } from 'src/app/services/common.service';
import { SituationService } from 'src/app/services/situation.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-situations',
    templateUrl: './situations.component.html',
    styleUrls: ['./situations.component.scss']
})
export class SituationsComponent implements OnInit {

    situationName: string = ""

    situation_obj!: Situation;

    actionSelected: "radio_action_0" | "radio_action_1" | "radio_action_2" | "radio_action_3" | "radio_action_4" | "radio_action_5" | "radio_action_6" | undefined = "radio_action_0";

    showOpponent2: boolean = true;

    constructor(
        private router: Router,
        private apiSituation: SituationService,
        private apiCommon: CommonService
    ) { }

    ngOnInit(): void {
        this.situation_obj = { ...this.apiCommon.empty_situation_obj };
    }

    redirectTo(page: string) {
        this.router.navigate([page]);
    }

    cancelSituation() {
        this.situationName = "";
        this.situation_obj = { ...this.apiCommon.empty_situation_obj };
        (document.getElementById("jetonsRestants") as HTMLInputElement).value = ""
        this.situation_obj.situations = this.situation_obj.situations.map((row: any) => {
            row.map((situation: any) => {
                return situation.action = undefined;
            })
            return row;
        });
    }

    saveAction(e: any) {
        let cell_index = e.target.cellIndex;
        let row_index = e.target.parentElement.rowIndex;
        this.situation_obj.situations[row_index][cell_index].action = this.actionSelected;
    }

    saveSituation() {
        console.log(this.situation_obj)
        if (this.situationName === "") {
            Swal.fire({
                icon: 'error',
                html: '<h1 style="font-family: \'Lato\', sans-serif; margin-top:-10px;">Erreur !</h1><p style="font-family: \'Lato\', sans-serif; margin-bottom:0; font-size: 1.2em;">Veuillez donner un nom à la situation avant de l\'enregistrer.</p>',
                confirmButtonColor: '#090a0f',
                confirmButtonText: '<p style="font-family: \'Lato\', sans-serif; margin-top:0; margin-bottom:0; font-size: 1.1em;">C\'est compris !</p>'
            })
        } else {
            let situation_empty = false;
            this.situation_obj.name = this.situationName;
            this.situation_obj.situations.map((row: any) => {
                row.map((situation: any) => {
                    if (situation.action === undefined) situation_empty = true;
                })
            })

            console.log("situation manquante =", situation_empty)
            if (situation_empty) {
                Swal.fire({
                    icon: 'error',
                    html: '<h1 style="font-family: \'Lato\', sans-serif; margin-top:-10px;">Erreur !</h1><p style="font-family: \'Lato\', sans-serif; margin-bottom:0; font-size: 1.2em;">Veuillez remplir toutes les cases du tableau avant d\'enregistrer.</p>',
                    confirmButtonColor: '#090a0f',
                    confirmButtonText: '<p style="font-family: \'Lato\', sans-serif; margin-top:0; margin-bottom:0; font-size: 1.1em;">C\'est compris !</p>'
                })
            } else {
                let data = {
                    situation_name: this.situationName,
                    data: this.situation_obj
                }
                this.apiSituation.addSituation(data);
                Swal.fire({
                    position: 'top-end',
                    icon: 'success',
                    title: 'La situation a bien été créer !',
                    showConfirmButton: false,
                    timer: 2000
                })
                this.router.navigate(['home']);
            }
        }
    }

    onChangeAction(e: any) {
        this.actionSelected = e.target.value;
    }

    onChangeNBPlayer(nb_player: number) {
        if (nb_player === 2) {
            this.showOpponent2 = false;
            if (this.situation_obj.dealer === "opponent2") {
                document.getElementById("btnOpponent2Dealer")?.classList.remove("selectedButton")
                this.situation_obj.dealer = undefined;
            }
            document.getElementById("btn2Player")?.classList.add("selectedButton")
            document.getElementById("btn3Player")?.classList.remove("selectedButton")
        } else if (nb_player === 3) {
            this.showOpponent2 = true;
            document.getElementById("btn2Player")?.classList.remove("selectedButton")
            document.getElementById("btn3Player")?.classList.add("selectedButton")
        }
        this.situation_obj.nbPlayer = nb_player;
        console.log(this.situation_obj)
    }

    onChangeDealer(dealer: string) {
        if (dealer === "you") {
            document.getElementById("btnYouDealer")?.classList.add("selectedButton")
            document.getElementById("btnOpponent1Dealer")?.classList.remove("selectedButton")
            document.getElementById("btnOpponent2Dealer")?.classList.remove("selectedButton")
        } else if (dealer === "opponent1") {
            document.getElementById("btnYouDealer")?.classList.remove("selectedButton")
            document.getElementById("btnOpponent1Dealer")?.classList.add("selectedButton")
            document.getElementById("btnOpponent2Dealer")?.classList.remove("selectedButton")
        } else if (dealer === "opponent2") {
            document.getElementById("btnYouDealer")?.classList.remove("selectedButton")
            document.getElementById("btnOpponent1Dealer")?.classList.remove("selectedButton")
            document.getElementById("btnOpponent2Dealer")?.classList.add("selectedButton")
        }
        this.situation_obj.dealer = dealer;
        console.log(this.situation_obj)
    }

    onChangeNBMissingTokens(event: any) {
        this.situation_obj.dealerMissingTokens = parseInt(event.target.value);
        console.log(this.situation_obj)
    }

}
