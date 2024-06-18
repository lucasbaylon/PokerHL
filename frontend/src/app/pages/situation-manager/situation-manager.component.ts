import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SituationService } from '../../services/situation.service';
import { CommonService } from '../../services/common.service';
import { cloneDeep } from 'lodash';
import { NgxSliderModule, Options } from '@angular-slider/ngx-slider';
import { Situation } from '../../interfaces/situation';
import { Subscription } from 'rxjs';
import { Action } from '../../interfaces/action';
import { FormsModule } from '@angular/forms';
import { NgClass, NgStyle } from '@angular/common';
import { ActionColorPipe } from '../../pipes/action-color.pipe';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { UserParams } from '../../interfaces/user-params';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
    selector: 'app-situation-manager',
    standalone: true,
    imports: [FormsModule, NgStyle, NgClass, ActionColorPipe, InputNumberModule, DropdownModule, InputTextModule, NgxSliderModule, CheckboxModule],
    templateUrl: './situation-manager.component.html',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
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
    simpleSlider: boolean = true;
    multipleSlider: boolean = false;
    countMultipleSolution: number = 0;
    multipleSituationId?: string;
    editSituationName?: string;
    multipleSolutionCheckBox: string[] = [];
    listener: any;

    options: Options = {
        floor: 0,
        ceil: 100
    };

    availableSituationType: any[] = [
        { name: 'Pré-flop', code: 'preflop' },
        { name: 'Flop', code: 'flop' }
    ];

    availableNbPlayersTable: any[] = [
        { name: '2', code: 2 },
        { name: '3', code: 3 }
    ];

    allPositions: any[] = [
        { name: 'SB', code: 'sb' },
        { name: 'BB', code: 'bb' },
        { name: 'BU', code: 'bu' } // Ajouté pour le cas où nbPlayer = 3
    ];

    allOpponentLevels: any[] = [
        { name: 'Débutant', code: 'fish' },
        { name: 'Confirmé', code: 'shark' },
        { name: 'Mixte', code: 'fish_shark' } // Ajouté pour le cas où nbPlayer = 3
    ];

    availablePositionPlayer: any[] = this.allPositions.filter(pos => pos.code !== 'bu');
    availableOpponentsPlayersLevel: any[] = this.allOpponentLevels.filter(level => level.code !== 'fish_shark');
    availableFishPlayerPosition: any[] = [];

    nbPlayer: { name: string, code: number } = this.availableNbPlayersTable[0];

    position: { name: string, code: string } = this.availablePositionPlayer[0];

    opponentLevel: { name: string, code: string } = this.availableOpponentsPlayersLevel[0];

    situationType: { name: string, code: string } = this.availableSituationType[0];

    autoMultipleSolutionName: boolean = false;

    fishPosition?: { name: string, code: string } = this.availableFishPlayerPosition[0];

    constructor(
        private router: Router,
        private apiSituation: SituationService,
        public commonService: CommonService,
        private _Activatedroute: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.situation_obj = cloneDeep(this.commonService.empty_situation_obj);
        this.situation_objActionsRef = this.situation_obj.actions.slice();
        if (this._Activatedroute.snapshot.params["situation_id"]) {
            this.apiSituation.getSituation(this._Activatedroute.snapshot.params["situation_id"]);
        }

        this.situationSubscription = this.apiSituation.situation.subscribe(situation_str => {
            this.mode = "edit";
            this.situation_obj = JSON.parse(situation_str);
            this.editSituationName = this.situation_obj.name;
            this.situation_objActionsRef = this.situation_obj.actions.slice();

            // Initialisation des listes et des valeurs
            this.initializeValues();

            let actionList = this.situation_obj.actions.filter(action => action.type === "mixed");
            this.countMultipleSolution = actionList.length;
        });

        const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
        if (userParams.autoMultipleSolutionName) this.autoMultipleSolutionName = true;
        this.updateAvailableFishPositions();
    }

    initializeValues() {
        // Définir nbPlayer en premier pour ajuster les listes
        this.nbPlayer = this.availableNbPlayersTable.find(nbPlayer => nbPlayer.code === this.situation_obj.nbPlayer);
        this.onChangeNbPlayersTable(); // Met à jour les listes disponibles

        // Définir les autres valeurs après mise à jour des listes
        this.position = this.availablePositionPlayer.find(position => position.code === this.situation_obj.position);
        this.opponentLevel = this.availableOpponentsPlayersLevel.find((opponentLevel) => opponentLevel.code === this.situation_obj.opponentLevel);

        // Mettre à jour la liste des positions du fish après avoir défini la position principale
        this.updateAvailableFishPositions();
        this.fishPosition = this.availableFishPlayerPosition.find(position => position.code === this.situation_obj.fishPosition);

        // Pour le type de situation (si applicable, à adapter selon votre logique)
        if (this.availableSituationType) {
            this.situationType = this.availableSituationType.find(situationType => situationType.code === this.situation_obj.type);
        }
    }

    updateAvailableFishPositions() {
        this.availableFishPlayerPosition = this.allPositions.filter(pos => pos.code !== this.position.code);
        if (this.availableFishPlayerPosition.length > 0) {
            this.fishPosition = this.availableFishPlayerPosition[0];
        } else {
            this.fishPosition = undefined;
        }
    }

    ngOnDestroy() {
        this.situationSubscription.unsubscribe();
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

    showAddMultiplesActionModal() {
        const modal = document.getElementById('add-multiples-solutions') as HTMLDialogElement;
        if (modal) {
            modal.showModal();
        }
    }

    closeMultiplesActionModal() {
        const modal = document.getElementById('add-multiples-solutions') as HTMLDialogElement;
        if (modal) {
            modal.close();
        }
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
            this.commonService.showSwalToast(`Veuillez donner un nom à la situation.`, 'error');
        } else {
            let situation_empty = false;
            this.situation_obj.situations.map((row: any) => {
                row.map((situation: any) => {
                    if (situation.action === undefined) situation_empty = true;
                })
            });
            // On check si toutes les cases sont bien remplies
            if (situation_empty) {
                this.commonService.showSwalToast(`Veuillez remplir toutes les cases du tableau des ranges.`, 'error');
            } else {
                // On check si il y a bien un nombre de jetons
                if (!this.situation_obj.stack) {
                    this.commonService.showSwalToast(`Veuillez remplir le champ "Stack effectif".`, 'error');
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
                    // On check si toutes les solutions simple ont bien un nom
                    if (empty_action_input) {
                        this.commonService.showSwalToast(`Veuillez donner un nom aux actions utilisées dans le tableau.`, 'error');
                    } else {
                        this.situation_obj.actions = this.situation_obj.actions.filter(action => uniqueActions.includes(action.id));
                        if (this.mode === "new") {
                            this.apiSituation.checkSituationNameFromUser(this.situation_obj.name).subscribe((data: any) => {
                                if (data.exist) {
                                    this.commonService.showSwalToast(`Une situation existe déjà avec ce nom. Vous ne pouvez pas avoir deux situations avec le même nom.`, 'error');
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
                                        this.commonService.showSwalToast('Une situation existe déjà avec ce nom. Vous ne pouvez pas avoir deux situations avec le même nom.', 'error');
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
        this.commonService.showSwalToast(`Situation enregistrée !`);
        this.router.navigate(['situations-list-manager']);
    }

    editSituation() {
        this.apiSituation.editSituation(this.situation_obj);
        this.commonService.showSwalToast(`Situation modifiée !`);
        this.router.navigate(['situations-list-manager']);
    }

    onChangeAction(actionId: string) {
        this.actionSelected = actionId;
    }

    onChangeActionName(action_id: string, e: any) {
        let actionList = this.situation_obj.actions.filter(item => item.id === action_id)[0];
        actionList.display_name = e.target.value;
    }

    filteredActionList(list: Action[], type: string, filterNoDisplayName: boolean = false) {
        return list.filter(item => item.type === type && (!filterNoDisplayName || (item.display_name !== undefined && item.display_name !== '')));
    }

    onColorAction(action_id: string) {
        document.getElementById(`color-picker-div_${action_id}`)?.classList.remove("hidden");
        setTimeout(() => {
            this.listener = (event: any) => {
                if (document.getElementById(`color-picker-div_${action_id}`) !== event.target) {
                    document.getElementById(`color-picker-div_${action_id}`)?.classList.add('hidden');
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
        document.getElementById(`color-picker-div_${action_id}`)?.classList.add("hidden");
        this.situation_objActionsRef = this.situation_obj.actions.slice();
    }

    onCheckChange() {
        if (this.multipleSolutionCheckBox.length < 3) {
            this.simpleSlider = true;
            this.multipleSlider = false;
        } else if (this.multipleSolutionCheckBox.length === 3) {
            this.simpleSlider = false;
            this.multipleSlider = true;
        }
    }

    saveMultipleSolution() {
        const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
        if (this.multipleSolutionCheckBox.length < 2) {
            this.commonService.showSwalToast(`Veuillez cocher au moins deux cases.`, 'error');
            return;
        }

        if (this.multipleSolutionCheckBox.length === 2 && (this.mixedSolutionSliderMinValue === 0 || this.mixedSolutionSliderMinValue === 100)) {
            this.commonService.showSwalToast(`Veuillez définir une valeur entre 1 et 99 pour le premier slider.`, 'error');
            return;
        }

        if (this.multipleSolutionCheckBox.length === 3 &&
            (this.mixedSolutionSliderMinValue === 0 || this.mixedSolutionSliderMinValue === 100 ||
                this.mixedSolutionSliderMaxValue === 0 || this.mixedSolutionSliderMaxValue === 100)) {
            this.commonService.showSwalToast(`Veuillez une valeur entre 1 et 99 pour le premier et le deuxième slider.`, 'error');
            return;
        }

        const actionsLst: {
            color: string;
            percent?: number | undefined;
        }[] = [];

        this.multipleSolutionCheckBox.map((action, index) => {
            let percent = 0;
            if (index === 0) percent = this.mixedSolutionSliderMinValue;
            if (index === 1 && this.multipleSolutionCheckBox.length === 3) percent = this.mixedSolutionSliderMaxValue - this.mixedSolutionSliderMinValue;
            if (index + 1 === this.multipleSolutionCheckBox.length) {
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
            actionsLst.push(obj);
        });
        if (userParams.autoMultipleSolutionName) {
            this.multipleSolutionName = "";
            actionsLst.forEach((actionItem, index) => {
                const action = this.situation_obj.actions.find(action => action.id === actionItem.color);
                if (action) {
                    this.multipleSolutionName += action.display_name!.replace(/ /g, '_') + '_' + actionItem.percent;
                    if (index + 1 < actionsLst.length) this.multipleSolutionName += '_';
                }
            });
        } else {
            if (this.multipleSolutionName === "") {
                this.commonService.showSwalToast(`Veuillez donner un nom à la solution multiple.`, 'error');
                return;
            }
        }
        let new_obj = {
            id: this.multipleSituationId ? this.multipleSituationId : `mixed_action_${this.countMultipleSolution}`,
            type: "mixed",
            display_name: this.multipleSolutionName,
            colorList: actionsLst
        }
        if (this.multipleSituationId) {
            const indexToReplace = this.situation_obj.actions.findIndex(action => action.id === this.multipleSituationId);
            if (indexToReplace !== -1) {
                this.situation_obj.actions = [
                    ...this.situation_obj.actions.slice(0, indexToReplace),
                    new_obj,
                    ...(this.situation_obj.actions.length > 1 ? this.situation_obj.actions.slice(indexToReplace + 1) : [])
                ];
                // (document.getElementById(`button_${this.multipleSituationId}`) as HTMLInputElement).checked = true;
            }
        } else {
            this.countMultipleSolution++;
            this.situation_obj.actions.push(new_obj);
        }
        this.situation_objActionsRef = this.situation_obj.actions.slice();
        this.resetMultipleSituation();
    }

    resetMultipleSituation() {
        this.simpleSlider = true;
        this.multipleSlider = false;
        this.mixedSolutionSliderMinValue = 50;
        this.mixedSolutionSliderMaxValue = 100;
        this.multipleSolutionCheckBox = [];
        this.multipleSolutionName = "";
        this.multipleSituationId = undefined;
        this.closeMultiplesActionModal();
    }

    editMultipleSolution(action_id: string) {
        let action: Action = this.situation_objActionsRef.filter((action: Action) => action.id === action_id)[0];
        this.multipleSituationId = action.id;
        this.multipleSolutionName = action.display_name!;
        this.multipleSolutionCheckBox = action.colorList!.map(action => action.color);
        if (action.colorList?.length === 2) {
            this.mixedSolutionSliderMinValue = action.colorList[0].percent!;
        } else if (action.colorList?.length === 3) {
            this.mixedSolutionSliderMinValue = action.colorList[0].percent!;
            this.mixedSolutionSliderMaxValue = action.colorList[0].percent! + action.colorList[1].percent!;
        }

        if (this.multipleSolutionCheckBox.length < 3) {
            this.simpleSlider = true;
            this.multipleSlider = false;
        } else if (this.multipleSolutionCheckBox.length === 3) {
            this.simpleSlider = false;
            this.multipleSlider = true;
        }
        this.showAddMultiplesActionModal();
    }

    /**
    * Supprime une solution multiple de la liste des solutions multiples de situation_obj en utilisant son identifiant.
    * Met également à jour la référence locale situation_objActionsRef avec la liste des actions mise à jour.
    *
    * @param {string} multiple_solution_id - L'identifiant de la solution multiple à supprimer.
    */
    deleteMultipleSolution(multiple_solution_id: string) {
        const actions = this.situation_obj.actions;
        const index = actions.findIndex(action => action.id === multiple_solution_id);

        if (index !== -1) {
            actions.splice(index, 1);
            this.situation_objActionsRef = [...actions];
        }
    }

    onChangeNbPlayersTable() {
        this.situation_obj.nbPlayer = this.nbPlayer.code;
        if (this.nbPlayer.code === 2) {
            this.availablePositionPlayer = this.allPositions.filter(pos => pos.code !== 'bu');
            this.availableOpponentsPlayersLevel = this.allOpponentLevels.filter(level => level.code !== 'fish_shark');
            if (this.position.code === 'bu') {
                this.position = this.availablePositionPlayer[0];
            }
            if (this.opponentLevel.code === 'fish_shark') {
                this.opponentLevel = this.availableOpponentsPlayersLevel[0];
            }
        } else {
            this.availablePositionPlayer = [...this.allPositions];
            this.availableOpponentsPlayersLevel = [...this.allOpponentLevels];
        }
        this.updateAvailableFishPositions();
    }

    /**
    * Fonction générique pour gérer les changements de différentes propriétés de situation_obj.
    * 
    * @param {string} property - La propriété de situation_obj à mettre à jour.
    * @param {any} value - La nouvelle valeur à attribuer à la propriété.
    */
    onChangeProperty(property: string, value: any) {
        (this.situation_obj as any)[property] = value.code;

        if (property === 'position') {
            this.updateAvailableFishPositions();
        }
    }

}
