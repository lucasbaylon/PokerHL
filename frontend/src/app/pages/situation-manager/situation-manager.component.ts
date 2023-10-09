import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Situation } from 'src/app/interfaces/situation';
import { CommonService } from 'src/app/services/common.service';
import { SituationService } from 'src/app/services/situation.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { Action } from 'src/app/interfaces/action';
import { Options } from 'ngx-slider-v2';
import { cloneDeep } from 'lodash';

@Component({
    selector: 'app-situation-manager',
    templateUrl: './situation-manager.component.html',
    styleUrls: ['./situation-manager.component.scss']
})
export class SituationManagerComponent {

    mode: string = "new";

    situationSubscription!: Subscription;

    multipleSolutionName: string = "";

    situation_obj!: Situation;

    actionSelected: string = "unique_action_0";

    showOpponent2: boolean = true;

    isSelectionActive: boolean = false;

    situation_objActionsRef: any;

    mixedSolutionSliderMinValue: number = 50;

    mixedSolutionSliderMaxValue: number = 100;

    listener: any;

    options: Options = {
        floor: 0,
        ceil: 100
    };

    simpleSlider: boolean = true;

    multipleSlider: boolean = false;

    checkboxMultipleSolutionChecked: number = 0;

    multipleSolutionCheckedList: string[] = [];

    countMultipleSolution: number = 0;

    multipleSituationId?: string;

    editSituationName?: string;

    nbPlayer: { name: string, code: number } = { name: '2', code: 2 };
    dealer: { name: string, code: string } = { name: 'Vous', code: 'you' };
    opponentLevel: { name: string, code: string } = { name: 'Débutant', code: 'fish' };

    availableNbPlayersTable: any[] = [
        { name: '2', code: 2 },
        { name: '3', code: 3 }
    ];

    availableDealerPlayer: any[] = [
        { name: 'Vous', code: 'you' },
        { name: 'Adversaire 1', code: 'opponent1' },
        { name: 'Adversaire 1', code: 'opponent1' },
        { name: 'Adversaire 2', code: 'opponent2' }
    ];

    availableOpponentsPlayersLevel: any[] = [
        { name: 'Débutant', code: 'fish' },
        { name: 'Confirmé', code: 'shark' }
    ];

    constructor(
        private router: Router,
        private apiSituation: SituationService,
        public apiCommon: CommonService,
        private _Activatedroute: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.situation_obj = cloneDeep(this.apiCommon.empty_situation_obj);
        this.situation_objActionsRef = this.situation_obj.actions.slice();
        if (this._Activatedroute.snapshot.params["situation_id"]) {
            this.apiSituation.getSituation(this._Activatedroute.snapshot.params["situation_id"]);
        }

        this.situationSubscription = this.apiSituation.situation.subscribe(situation_str => {
            this.mode = "edit";
            this.situation_obj = JSON.parse(situation_str);
            this.editSituationName = this.situation_obj.name;
            this.situation_objActionsRef = this.situation_obj.actions.slice();
            this.nbPlayer = this.availableNbPlayersTable.find((nbPlayer) => nbPlayer.code === this.situation_obj.nbPlayer);
            this.dealer = this.availableDealerPlayer.find((dealer) => dealer.code === this.situation_obj.dealer);
            this.opponentLevel = this.availableOpponentsPlayersLevel.find((opponentLevel) => opponentLevel.code === this.situation_obj.opponentLevel);

            let actionList = this.situation_obj.actions.filter(action => action.type === "mixed");
            this.countMultipleSolution = actionList.length;
        });
    }

    ngOnDestroy() {
        this.situationSubscription.unsubscribe();
    }

    redirectTo(page: string) {
        this.router.navigate([page]);
    }

    getRandomColor(): string {
        let colorList = ["#d80c05", "#ff9100", "#7a5a00", "#3f7a89", "#96c582", "#303030", "#1c51ff", "#00aeff", "#8400ff", "#e284ff"];
        const colorActionsSituation = this.situation_obj.actions.map(action => action.color);

        const filteredColorList = colorList.filter(color => !colorActionsSituation.includes(color));

        const randomIndex = Math.floor(Math.random() * filteredColorList.length);

        return filteredColorList[randomIndex];
    }

    addUniqueAction() {
        let actionList = this.situation_obj.actions.filter(action => action.type === "unique");
        if (actionList.length < 7) {
            let color = this.getRandomColor();
            this.situation_obj.actions.push({ id: `unique_action_${actionList.length}`, type: "unique", display_name: undefined, color: color });
            this.situation_objActionsRef = this.situation_obj.actions.slice();
            if (actionList.length === 6) {
                document.getElementById("add-solution-button")!.style.display = "none";
            }
        }
    }

    showAddMultiplesAction() {
        document.getElementById("add-multiples-solutions")!.style.display = "block";
    }

    startSelection(event: any) {
        let cell_index = event.target.cellIndex;
        let row_index = event.target.parentElement.rowIndex;
        if (event.button === 0) {
            this.isSelectionActive = true;
            this.situation_obj.situations[row_index][cell_index].action = this.actionSelected;
        } else if (event.button === 2) {
            for (let i = cell_index; i < this.situation_obj.situations[row_index].length; i++) {
                this.situation_obj.situations[row_index][i].action = this.actionSelected;
            }
        }
    }

    updateSelection(event: any) {
        let cell_index = event.target.cellIndex;
        let row_index = event.target.parentElement.rowIndex;
        if (!this.isSelectionActive) {
            return;
        }

        this.isSelectionActive = true;
        if (event.button === 0) {
            this.situation_obj.situations[row_index][cell_index].action = this.actionSelected;
        } else if (event.button === 2) {
            for (let i = cell_index; i < this.situation_obj.situations[row_index].length; i++) {
                this.situation_obj.situations[row_index][i].action = this.actionSelected;
            }
        }
    }

    endSelection(event: any) {
        if (event.button === 0) {
            this.isSelectionActive = false;
        }
    }

    saveSituation() {
        // On check si il y a bien un nom à la situation
        if (!this.situation_obj.name) {
            Swal.fire({
                icon: 'error',
                html: '<h1 style="font-family: \'Lato\', sans-serif; margin-top:-10px;">Erreur !</h1><p style="font-family: \'Lato\', sans-serif; margin-bottom:0; font-size: 1.2em;">Veuillez donner un nom à la situation.</p>',
                confirmButtonColor: '#d74c4c',
                confirmButtonText: '<p style="font-family: \'Lato\', sans-serif; margin-top:0; margin-bottom:0; font-size: 1.1em; font-weight: 600;">C\'est compris !</p>'
            });
        } else {
            let situation_empty = false;
            this.situation_obj.situations.map((row: any) => {
                row.map((situation: any) => {
                    if (situation.action === undefined) situation_empty = true;
                })
            });
            // On check si toutes les cases sont bien remplies
            if (situation_empty) {
                Swal.fire({
                    icon: 'error',
                    html: '<h1 style="font-family: \'Lato\', sans-serif; margin-top:-10px;">Erreur !</h1><p style="font-family: \'Lato\', sans-serif; margin-bottom:0; font-size: 1.2em;">Veuillez remplir toutes les cases du tableau.</p>',
                    confirmButtonColor: '#d74c4c',
                    confirmButtonText: '<p style="font-family: \'Lato\', sans-serif; margin-top:0; margin-bottom:0; font-size: 1.1em; font-weight: 600;">C\'est compris !</p>'
                });
            } else {
                // On check si il y a bien un nombre de jetons
                if (!this.situation_obj.dealerMissingTokens) {
                    Swal.fire({
                        icon: 'error',
                        html: '<h1 style="font-family: \'Lato\', sans-serif; margin-top:-10px;">Erreur !</h1><p style="font-family: \'Lato\', sans-serif; margin-bottom:0; font-size: 1.2em;">Veuillez remplir le nombre de BB restantes pour les joueurs.</p>',
                        confirmButtonColor: '#d74c4c',
                        confirmButtonText: '<p style="font-family: \'Lato\', sans-serif; margin-top:0; margin-bottom:0; font-size: 1.1em; font-weight: 600;">C\'est compris !</p>'
                    });
                } else {
                    const flatArray = this.situation_obj.situations.flat();
                    const uniqueActions = Array.from(new Set(flatArray.map(item => item.action)));
                    let empty_action_input: boolean = false;

                    uniqueActions.forEach(action => {
                        let input = document.getElementById(`input_${action}`) as HTMLInputElement;
                        if (input && input.value === "") {
                            empty_action_input = true;
                        }
                    });
                    // On check si toutes les situations simple ont bien un nom
                    if (empty_action_input) {
                        Swal.fire({
                            icon: 'error',
                            html: '<h1 style="font-family: \'Lato\', sans-serif; margin-top:-10px;">Erreur !</h1><p style="font-family: \'Lato\', sans-serif; margin-bottom:0; font-size: 1.2em;">Veuillez donner un nom aux actions utilisées dans le tableau.</p>',
                            confirmButtonColor: '#d74c4c',
                            confirmButtonText: '<p style="font-family: \'Lato\', sans-serif; margin-top:0; margin-bottom:0; font-size: 1.1em; font-weight: 600;">C\'est compris !</p>'
                        });
                    } else {
                        if (this.mode === "new") {
                            this.apiSituation.checkSituationNameFromUser(this.situation_obj.name).subscribe((data: any) => {
                                if (data.exist) {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Attention',
                                        text: 'Une situation existe déjà avec ce nom. Vous ne pouvez pas avoir deux situations avec le même nom.'
                                    });
                                } else {
                                    this.addSituation();
                                }
                            });
                        } else if (this.mode === "edit") {
                            let situation_name_change = false;
                            if (this.situation_obj.name !== this.editSituationName) {
                                situation_name_change = true;
                            }
                            if (situation_name_change) {
                                this.apiSituation.checkChangeSituationNameFromUser(this.situation_obj.id!, this.situation_obj.name).subscribe((data: any) => {
                                    if (data.exist) {
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'Attention',
                                            text: 'Une situation existe déjà avec ce nom. Vous ne pouvez pas avoir deux situations avec le même nom.'
                                        });
                                    } else {
                                        this.editSituation();
                                    }
                                });
                            } else {
                                this.editSituation();
                            }
                        }
                    }
                }
            }
        }
    }

    addSituation() {
        this.apiSituation.addSituation(this.situation_obj);
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            html: '<h2 style="font-family: \'Lato\', sans-serif;margin-top:16px; margin-bottom:0; font-size: 1.5em;">Situation enregistrée !</h3>',
            showConfirmButton: false,
            width: '370px',
            timer: 2500
        });
        this.router.navigate(['situations-list-manager']);
    }

    editSituation() {
        this.apiSituation.editSituation(this.situation_obj);
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            html: '<h2 style="font-family: \'Lato\', sans-serif;margin-top:16px; margin-bottom:0; font-size: 1.5em;">Situation modifiée !</h3>',
            showConfirmButton: false,
            width: '339px',
            timer: 2500
        });
        this.router.navigate(['situations-list-manager']);
    }

    onChangeAction(e: any) {
        this.actionSelected = e.target.value;
    }

    onChangeActionName(action_id: string, e: any) {
        let actionList = this.situation_obj.actions.filter(item => item.id === action_id)[0];
        actionList.display_name = e.target.value;
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
        setTimeout(() => {
            this.listener = (event: any) => {
                if (document.getElementById(`color-picker-div_${action_id}`) !== event.target) {
                    document.getElementById(`color-picker-div_${action_id}`)?.classList.add('color-picker-div-closed');
                    document.removeEventListener('click', this.listener);
                    this.listener = null;
                }
            };
            document.addEventListener('click', this.listener);
        }, 0);
    }

    onSelectColor(action_id: string, color: string) {
        let actionList = this.situation_obj.actions.filter(action => action.id === action_id)[0];
        actionList.color = color;
        document.getElementById(`color-picker-div_${action_id}`)?.classList.add("color-picker-div-closed");
        this.situation_objActionsRef = this.situation_obj.actions.slice();
    }

    onCheckChange(e: any) {
        let checkbox_id = e.target.id;
        if (e.target.checked) {
            if (this.checkboxMultipleSolutionChecked < 3) {
                this.checkboxMultipleSolutionChecked++;
                this.multipleSolutionCheckedList.push(checkbox_id.replace("id_check_", ""));
            } else {
                e.target.checked = false;
            }
        } else {
            this.checkboxMultipleSolutionChecked--;
            const index: number = this.multipleSolutionCheckedList.indexOf(checkbox_id.replace("id_check_", ""));
            if (index !== -1) {
                this.multipleSolutionCheckedList.splice(index, 1);
            }
        }

        if (this.checkboxMultipleSolutionChecked < 3) {
            this.simpleSlider = true;
            this.multipleSlider = false;
        } else if (this.checkboxMultipleSolutionChecked === 3) {
            this.simpleSlider = false;
            this.multipleSlider = true;
        }
    }

    addMultipleAction() {
        this.multipleSolutionCheckedList.sort((a: string, b: string) => {
            const numA = parseInt(a.slice(14));
            const numB = parseInt(b.slice(14));

            return numA - numB;
        });
        if (this.multipleSolutionName === "") {
            Swal.fire({
                icon: 'error',
                html: '<h1 style="font-family: \'Lato\', sans-serif; margin-top:-10px;">Erreur !</h1><p style="font-family: \'Lato\', sans-serif; margin-bottom:0; font-size: 1.2em;">Merci de donner un nom à la solution multiple.</p>',
                confirmButtonColor: '#d74c4c',
                confirmButtonText: '<p style="font-family: \'Lato\', sans-serif; margin-top:0; margin-bottom:0; font-size: 1.1em; font-weight: 600;">C\'est compris !</p>'
            });
        } else {
            if (this.checkboxMultipleSolutionChecked < 2) {
                Swal.fire({
                    icon: 'error',
                    html: '<h1 style="font-family: \'Lato\', sans-serif; margin-top:-10px;">Erreur !</h1><p style="font-family: \'Lato\', sans-serif; margin-bottom:0; font-size: 1.2em;">Merci de cocher au moins deux cases.</p>',
                    confirmButtonColor: '#d74c4c',
                    confirmButtonText: '<p style="font-family: \'Lato\', sans-serif; margin-top:0; margin-bottom:0; font-size: 1.1em; font-weight: 600;">C\'est compris !</p>'
                });
            } else {
                let colorLst: {
                    color: string;
                    percent?: number | undefined;
                }[] = [];
                this.multipleSolutionCheckedList.map((action, index) => {
                    let percent = 0;
                    if (index === 0) percent = this.mixedSolutionSliderMinValue;
                    if (index === 1 && this.multipleSolutionCheckedList.length === 3) percent = this.mixedSolutionSliderMaxValue - this.mixedSolutionSliderMinValue;
                    if (index + 1 === this.multipleSolutionCheckedList.length) {
                        if (this.mixedSolutionSliderMaxValue === 100) {
                            percent = 100 - this.mixedSolutionSliderMinValue;
                        } else {
                            percent = 100 - this.mixedSolutionSliderMaxValue;
                        }
                    }

                    let obj = {
                        color: action,
                        percent: percent
                    }
                    colorLst.push(obj);
                });
                let new_obj = {
                    id: this.multipleSituationId ? this.multipleSituationId : `mixed_action_${this.countMultipleSolution}`,
                    type: "mixed",
                    display_name: this.multipleSolutionName,
                    colorList: colorLst
                }
                if (this.multipleSituationId) {
                    const indexToReplace = this.situation_obj.actions.findIndex(action => action.id === this.multipleSituationId);
                    if (indexToReplace !== -1) {
                        this.situation_obj.actions = [
                            ...this.situation_obj.actions.slice(0, indexToReplace),
                            new_obj,
                            ...(this.situation_obj.actions.length > 1 ? this.situation_obj.actions.slice(indexToReplace + 1) : [])
                        ];
                        (document.getElementById(`radio_${this.multipleSituationId}`) as HTMLInputElement).checked = true;
                    }
                } else {
                    this.countMultipleSolution++;
                    this.situation_obj.actions.push(new_obj);
                }
                this.situation_objActionsRef = this.situation_obj.actions.slice();
                this.resetMultipleSituation();
            }
        }
    }

    resetMultipleSituation() {
        this.simpleSlider = true;
        this.multipleSlider = false;
        this.checkboxMultipleSolutionChecked = 0;
        this.mixedSolutionSliderMinValue = 50;
        this.mixedSolutionSliderMaxValue = 100;
        this.multipleSolutionCheckedList.map(action => (document.getElementById(`id_check_${action}`) as HTMLInputElement).checked = false);
        this.multipleSolutionCheckedList = [];
        this.multipleSolutionName = "";
        this.multipleSituationId = undefined;
        document.getElementById("add-multiples-solutions")!.style.display = "none";
    }

    editMultipleSolution(action_id: string) {
        let action: Action = this.situation_objActionsRef.filter((action: Action) => action.id === action_id)[0];
        this.multipleSituationId = action.id;
        this.multipleSolutionName = action.display_name!;
        this.multipleSolutionCheckedList = action.colorList!.map(action => action.color);
        this.multipleSolutionCheckedList.map(action => (document.getElementById(`id_check_${action}`) as HTMLInputElement).checked = true);
        this.checkboxMultipleSolutionChecked = this.multipleSolutionCheckedList.length;
        if (action.colorList?.length === 2) {
            this.mixedSolutionSliderMinValue = action.colorList[0].percent!;
        } else if (action.colorList?.length === 3) {
            this.mixedSolutionSliderMinValue = action.colorList[0].percent!;
            this.mixedSolutionSliderMaxValue = action.colorList[0].percent! + action.colorList[1].percent!;
        }

        if (this.checkboxMultipleSolutionChecked < 3) {
            this.simpleSlider = true;
            this.multipleSlider = false;
        } else if (this.checkboxMultipleSolutionChecked === 3) {
            this.simpleSlider = false;
            this.multipleSlider = true;
        }

        document.getElementById("add-multiples-solutions")!.style.display = "block";
    }

    deleteMultipleSolution(action_id: string) {
        const index = this.situation_obj.actions.findIndex(action => action.id === action_id);
        if (index !== -1) {
            this.situation_obj.actions.splice(index, 1);
        }
        this.situation_objActionsRef = this.situation_obj.actions.slice();
    }

    onChangeNbPlayersTable() {
        this.situation_obj.nbPlayer = this.nbPlayer.code;
    }

    onChangeDealer() {
        this.situation_obj.dealer = this.dealer.code;
    }

    onChangeOpponentLevel() {
        this.situation_obj.opponentLevel = this.opponentLevel.code;
    }

}
