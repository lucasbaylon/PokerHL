import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Situation } from 'src/app/interfaces/situation';
import { CommonService } from 'src/app/services/common.service';
import { SituationService } from 'src/app/services/situation.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { Action } from 'src/app/interfaces/action';
import { Options } from '@angular-slider/ngx-slider';

@Component({
    selector: 'app-situations',
    templateUrl: './situations.component.html',
    styleUrls: ['./situations.component.scss']
})
export class SituationsComponent implements OnInit {

    mode: string = "new";

    dealerMissingTokens: number = 0;

    situationSubscription!: Subscription;

    situationName: string = ""

    multipleSolution: string = ""

    situation_obj!: Situation;

    actionSelected: string = "unique_action_0";

    showOpponent2: boolean = true;

    isSelectionActive: boolean = false;

    situation_objActionsRef: any;

    mixedSolutionSliderMinValue: number = 50;

    mixedSolutionSliderMaxValue: number = 100;

    options: Options = {
        floor: 0,
        ceil: 100
    };

    constructor(
        private router: Router,
        private apiSituation: SituationService,
        private apiCommon: CommonService,
        private _Activatedroute: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.situation_obj = { ...this.apiCommon.empty_situation_obj };
        this.situation_objActionsRef = this.situation_obj.actions.slice();
        if (this._Activatedroute.snapshot.params["situation_id"]) {
            this.apiSituation.getSituation(this._Activatedroute.snapshot.params["situation_id"]);
        }

        this.situationSubscription = this.apiSituation.situation.subscribe(situation_str => {
            this.mode = "edit";
            this.situation_obj = JSON.parse(situation_str);
            this.situationName = this.situation_obj.name!;
            this.dealerMissingTokens = this.situation_obj.dealerMissingTokens;
            this.changeNBPlayer(this.situation_obj.nbPlayer!)
            this.changeDealer(this.situation_obj.dealer!);
            this.onChangeOpponentLevel(this.situation_obj.opponentLevel!)
        });
    }

    ngOnDestroy() {
        // Désabonnez-vous du socket avant de détruire le component
        this.situationSubscription.unsubscribe();
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

    addUniqueAction() {
        let actionList = this.situation_obj.actions.filter(action => action.type === "unique");
        if (actionList.length < 7) {
            this.situation_obj.actions.push({ id: `unique_action_${actionList.length}`, type: "unique", display_name: undefined });
            if (actionList.length === 6) {
                document.getElementById("add-solution-button")!.style.display = "none";
            }
        }
    }

    showAddMultiplesAction() {
        document.getElementById("add-multiples-solutions")!.style.display = "block";
    }

    closeMultiplesActionWindow() {
        document.getElementById("add-multiples-solutions")!.style.display = "none";
    }

    startSelection(event: any) {
        this.isSelectionActive = true;
        let cell_index = event.target.cellIndex;
        let row_index = event.target.parentElement.rowIndex;
        this.situation_obj.situations[row_index][cell_index].action = this.actionSelected;
    }

    updateSelection(event: any) {
        if (!this.isSelectionActive) {
            return;
        }

        this.isSelectionActive = true;
        let cell_index = event.target.cellIndex;
        let row_index = event.target.parentElement.rowIndex;
        this.situation_obj.situations[row_index][cell_index].action = this.actionSelected;
    }

    endSelection() {
        this.isSelectionActive = false;
    }

    saveSituation() {
        if (this.situationName === "") {
            Swal.fire({
                icon: 'error',
                html: '<h1 style="font-family: \'Lato\', sans-serif; margin-top:-10px;">Erreur !</h1><p style="font-family: \'Lato\', sans-serif; margin-bottom:0; font-size: 1.2em;">Veuillez donner un nom à la situation avant de l\'enregistrer.</p>',
                confirmButtonColor: '#d74c4c',
                confirmButtonText: '<p style="font-family: \'Lato\', sans-serif; margin-top:0; margin-bottom:0; font-size: 1.1em; font-weight: 600;">C\'est compris !</p>'
            });
        } else {
            let remove_file_obj = { remove_file: false, ex_name: "" };
            if (this.situation_obj._id) {
                if (this.situationName.replace(/ /g, "_") !== this.situation_obj._id) {
                    remove_file_obj.remove_file = true;
                    remove_file_obj.ex_name = this.situation_obj._id!;
                }
            }

            let situation_empty = false;
            this.situation_obj._id = this.situationName.replace(/ /g, "_");
            this.situation_obj.name = this.situationName;
            this.situation_obj.dealerMissingTokens = this.dealerMissingTokens;
            this.situation_obj.situations.map((row: any) => {
                row.map((situation: any) => {
                    if (situation.action === undefined) situation_empty = true;
                })
            })

            if (situation_empty) {
                Swal.fire({
                    icon: 'error',
                    html: '<h1 style="font-family: \'Lato\', sans-serif; margin-top:-10px;">Erreur !</h1><p style="font-family: \'Lato\', sans-serif; margin-bottom:0; font-size: 1.2em;">Veuillez remplir toutes les cases du tableau avant d\'enregistrer.</p>',
                    confirmButtonColor: '#d74c4c',
                    confirmButtonText: '<p style="font-family: \'Lato\', sans-serif; margin-top:0; margin-bottom:0; font-size: 1.1em; font-weight: 600;">C\'est compris !</p>'
                });
            } else {
                if ((document.getElementById("jetonsRestants") as HTMLInputElement).value === "") {
                    Swal.fire({
                        icon: 'error',
                        html: '<h1 style="font-family: \'Lato\', sans-serif; margin-top:-10px;">Erreur !</h1><p style="font-family: \'Lato\', sans-serif; margin-bottom:0; font-size: 1.2em;">Veuillez noter un nombre de BB restant pour les joueurs.</p>',
                        confirmButtonColor: '#d74c4c',
                        confirmButtonText: '<p style="font-family: \'Lato\', sans-serif; margin-top:0; margin-bottom:0; font-size: 1.1em; font-weight: 600;">C\'est compris !</p>'
                    });
                } else {
                    const flatArray = this.situation_obj.situations.flat();
                    const uniqueActions = Array.from(new Set(flatArray.map(item => item.action)));
                    let empty_action_input: boolean = false;
                    console.log(uniqueActions)

                    uniqueActions.forEach(action => {
                        console.log(action)
                        // const number_str = action![action!.length - 1];
                        // console.log(number_str)
                        if ((document.getElementById(`input_${action}`) as HTMLInputElement).value === "") {
                            empty_action_input = true;
                        }
                    });
                    if (empty_action_input) {
                        Swal.fire({
                            icon: 'error',
                            html: '<h1 style="font-family: \'Lato\', sans-serif; margin-top:-10px;">Erreur !</h1><p style="font-family: \'Lato\', sans-serif; margin-bottom:0; font-size: 1.2em;">Merci de donner un nom aux actions utilisé dans le tableau.</p>',
                            confirmButtonColor: '#d74c4c',
                            confirmButtonText: '<p style="font-family: \'Lato\', sans-serif; margin-top:0; margin-bottom:0; font-size: 1.1em; font-weight: 600;">C\'est compris !</p>'
                        });
                    } else {
                        this.apiSituation.addSituation(this.situation_obj, remove_file_obj);
                        Swal.fire({
                            position: 'top-end',
                            icon: 'success',
                            html: '<h2 style="font-family: \'Lato\', sans-serif;">Situation enregistrée !</h3>',
                            showConfirmButton: false,
                            backdrop: false,
                            timer: 3000
                        });
                        this.router.navigate(['manage']);
                    }
                }
            }
        }
    }

    onChangeAction(e: any) {
        this.actionSelected = e.target.value;
    }

    onChangeActionName(action_name: string, e: any) {
        let actionList = this.situation_obj.actions.filter(item => item.id === action_name)[0];
        actionList.display_name = e.target.value;
        console.log(this.situation_obj.actions)
    }

    onChangeNBPlayer(nb_player: number) {
        this.changeNBPlayer(nb_player);
        this.situation_obj.nbPlayer = nb_player;
    }

    changeNBPlayer(nb_player: number) {
        const btn2Player = document.getElementById("btn2Player");
        const btn3Player = document.getElementById("btn3Player");
        const btnOpponent2Dealer = document.getElementById("btnOpponent2Dealer");

        if (nb_player === 2) {
            this.showOpponent2 = false;
            if (this.situation_obj.dealer === "opponent2") {
                btnOpponent2Dealer?.classList.remove("selectedButton");
                this.situation_obj.dealer = undefined;
            }
            btn2Player?.classList.add("selectedButton");
            btn3Player?.classList.remove("selectedButton");
        } else if (nb_player === 3) {
            this.showOpponent2 = true;
            btn2Player?.classList.remove("selectedButton");
            btn3Player?.classList.add("selectedButton");
        }
    }

    onChangeDealer(dealer: string) {
        this.changeDealer(dealer);
        this.situation_obj.dealer = dealer;
    }

    changeDealer(dealer: string) {
        const buttonIds = ["btnYouDealer", "btnOpponent1Dealer", "btnOpponent2Dealer"];
        for (const id of buttonIds) {
            document.getElementById(id)?.classList.remove("selectedButton");
        }
        document.getElementById(`btn${dealer[0].toUpperCase() + dealer.slice(1)}Dealer`)?.classList.add("selectedButton");
    }

    onChangeOpponentLevel(opponentLevel: string) {
        this.situation_obj.opponentLevel = opponentLevel;
        this.setSelectedButton("fish", "btnFishOpponent", opponentLevel === "fish");
        this.setSelectedButton("shark", "btnSharkOpponent", opponentLevel === "shark");
    }

    setSelectedButton(opponentLevel: string, buttonId: string, isSelected: boolean) {
        const button = document.getElementById(buttonId);
        if (button) {
            if (isSelected) {
                button.classList.add("selectedButton");
            } else {
                button.classList.remove("selectedButton");
            }
        }
    }

    filteredActionList(list: Action[], type: string) {
        return list.filter(item => item.type === type);
    }

    onColorAction(action_id: string) {
        document.getElementById(`color-picker-div_${action_id}`)?.classList.remove("color-picker-div-closed");
        //TODO Supprimmer l'event listener lorsque la div est fermée
        setTimeout(() => {
            document.addEventListener('click', (event) => {
                if (document.getElementById(`color-picker-div_${action_id}`) !== event.target) {
                    document.getElementById(`color-picker-div_${action_id}`)?.classList.add('color-picker-div-closed');
                }
            });
        }, 0);
    }

    onSelectColor(action_id: string, color: string) {
        let actionList = this.situation_obj.actions.filter(action => action.id === action_id)[0]
        actionList.color = color;
        document.getElementById(`color-picker-div_${action_id}`)?.classList.add("color-picker-div-closed");
        this.situation_objActionsRef = this.situation_obj.actions.slice();
    }
}
