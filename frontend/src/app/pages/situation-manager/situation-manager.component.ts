import { NgxSliderModule, Options } from '@angular-slider/ngx-slider';
import { NgClass, NgStyle } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { cloneDeep } from 'lodash';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { Subscription } from 'rxjs';
import { Situation } from '../../interfaces/situation';
import { Solution } from '../../interfaces/solution';
import { UserParams } from '../../interfaces/user-params';
import { SolutionColorPipe } from '../../pipes/solution-color.pipe';
import { CommonService } from '../../services/common.service';
import { SituationService } from '../../services/situation.service';

@Component({
    selector: 'app-situation-manager',
    standalone: true,
    imports: [FormsModule, NgStyle, NgClass, SolutionColorPipe, InputNumberModule, DropdownModule, InputTextModule, NgxSliderModule, CheckboxModule],
    templateUrl: './situation-manager.component.html'
})
export class SituationManagerComponent {

    mode: string = "new";
    situationSubscription!: Subscription;
    multipleSolutionName: string = "";
    situation_obj!: Situation;
    solutionSelected: string = "unique_solution_0";
    showOpponent2: boolean = true;
    isSelectionActive: boolean = false;
    situation_objSolutionsRef: any;
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

    availablePreviousActions: any[] = [
        { name: 'Aucune', code: 'Aucune' },
        { name: 'Fold', code: 'Fold' },
        { name: 'Limp', code: 'Limp' },
        { name: 'Call', code: 'Call' },
        { name: 'Raise 2BB', code: 'Raise 2BB' },
        { name: 'Raise 2.5BB', code: 'Raise 2.5BB' },
        { name: 'Raise 3BB', code: 'Raise 3BB' },
        { name: 'Raise 4BB', code: 'Raise 4BB' },
        { name: 'Raise 5BB', code: 'Raise 5BB' },
        { name: 'Raise 10BB', code: 'Raise 10BB' },
        { name: 'All In', code: 'All In' }
    ];

    availableNbPlayersTable: any[] = [
        { name: '2', code: 2 },
        { name: '3', code: 3 }
    ];

    allPositions: any[] = [
        { name: 'SB', code: 'sb' },
        { name: 'BB', code: 'bb' },
        { name: 'BU', code: 'bu' }
    ];

    allOpponentLevels: any[] = [
        { name: 'Fish', code: 'fish' },
        { name: 'Reg', code: 'shark' },
        { name: 'Mixte', code: 'fish_shark' }
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

    previousPlayer1Action: { name: string, code: string } = { name: 'Aucune', code: 'Aucune' };
    
    previousPlayer2Action: { name: string, code: string } = { name: 'Aucune', code: 'Aucune' };

    constructor(
        private router: Router,
        private apiSituation: SituationService,
        public commonService: CommonService,
        private _Activatedroute: ActivatedRoute
    ) { }

    /**
     * Initialise le composant et s'abonne aux données de la situation.
     */
    ngOnInit(): void {
        this.situation_obj = cloneDeep(this.commonService.empty_situation_obj);
        this.situation_objSolutionsRef = this.situation_obj.solutions.slice();
        if (this._Activatedroute.snapshot.params["situation_id"]) {
            this.apiSituation.getSituation(this._Activatedroute.snapshot.params["situation_id"]);
        }

        this.situationSubscription = this.apiSituation.situation.subscribe(situation_str => {
            this.mode = "edit";
            this.situation_obj = JSON.parse(situation_str);
            this.editSituationName = this.situation_obj.name;
            this.situation_objSolutionsRef = this.situation_obj.solutions.slice();

            // Initialisation des listes et des valeurs
            this.initializeValues();

            const solutionLst = this.situation_obj.solutions.filter(solution => solution.type === "mixed");
            this.countMultipleSolution = solutionLst.length;
        });

        const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
        if (userParams.autoMultipleSolutionName) this.autoMultipleSolutionName = true;
        this.updateAvailableFishPositions();
    }

    /**
     * Synchronise les objets primeng-dropdown avec les valeurs de la situation chargée.
     */
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

        // Previous actions initialization
        this.previousPlayer1Action = this.situation_obj.previousPlayer1Action
            ? this.availablePreviousActions.find(act => act.code === this.situation_obj.previousPlayer1Action)
            : { name: 'Aucune', code: 'Aucune' };

        this.previousPlayer2Action = this.situation_obj.previousPlayer2Action
            ? this.availablePreviousActions.find(act => act.code === this.situation_obj.previousPlayer2Action)
            : { name: 'Aucune', code: 'Aucune' };

        // Pour le type de situation (si applicable, à adapter selon votre logique)
        if (this.availableSituationType) {
            this.situationType = this.availableSituationType.find(situationType => situationType.code === this.situation_obj.type);
        }
    }

    /**
     * Met à jour la liste des positions possibles pour le joueur "fish" (exclut le joueur principal).
     */
    updateAvailableFishPositions() {
        this.availableFishPlayerPosition = this.allPositions.filter(pos => pos.code !== this.position.code);
        if (this.availableFishPlayerPosition.length > 0) {
            this.fishPosition = this.availableFishPlayerPosition[0];
        } else {
            this.fishPosition = undefined;
        }
    }

    /**
     * Se désabonne des flux de données à la destruction du composant.
     */
    ngOnDestroy() {
        this.situationSubscription.unsubscribe();
    }

    /**
     * Sélectionne une couleur aléatoire qui n'est pas déjà utilisée.
     * @returns Code couleur hexadécimal.
     */
    getRandomColor(): string {
        let colorList = ["#d80c05", "#ff9100", "#7a5a00", "#3f7a89", "#96c582", "#303030", "#1c51ff", "#00aeff", "#8400ff", "#e284ff"];
        const colorSolutionsSituation = this.situation_obj.solutions.map(solution => solution.color);

        const filteredColorList = colorList.filter(color => !colorSolutionsSituation.includes(color));

        const randomIndex = Math.floor(Math.random() * filteredColorList.length);

        return filteredColorList[randomIndex];
    }

    /**
     * Ajoute une nouvelle solution de type "unique" à la situation.
     */
    addUniqueSolution() {
        let solutionLst = this.situation_obj.solutions.filter(solution => solution.type === "unique");
        if (solutionLst.length < 7) {
            let color = this.getRandomColor();
            this.situation_obj.solutions.push({ id: `unique_solution_${solutionLst.length}`, type: "unique", display_name: undefined, color: color });
            this.situation_objSolutionsRef = this.situation_obj.solutions.slice();
            if (solutionLst.length === 6) {
                document.getElementById("add-solution-button")!.style.display = "none";
            }
        }
    }

    /**
     * Commence la sélection de cases dans le tableau des ranges.
     * @param event L'événement souris.
     */
    startSelection(event: any) {
        let cell_index = event.target.cellIndex;
        let row_index = event.target.parentElement.rowIndex;
        if (event.button === 0) {
            this.isSelectionActive = true;
            this.situation_obj.situations[row_index][cell_index].solution = this.solutionSelected;
        } else if (event.button === 2) {
            for (let i = cell_index; i < this.situation_obj.situations[row_index].length; i++) {
                this.situation_obj.situations[row_index][i].solution = this.solutionSelected;
            }
        }
    }

    /**
     * Met à jour les cases survolées pendant une sélection active.
     * @param event L'événement souris.
     */
    updateSelection(event: any) {
        let cell_index = event.target.cellIndex;
        let row_index = event.target.parentElement.rowIndex;
        if (!this.isSelectionActive) {
            return;
        }

        this.isSelectionActive = true;
        if (event.button === 0) {
            this.situation_obj.situations[row_index][cell_index].solution = this.solutionSelected;
        } else if (event.button === 2) {
            for (let i = cell_index; i < this.situation_obj.situations[row_index].length; i++) {
                this.situation_obj.situations[row_index][i].solution = this.solutionSelected;
            }
        }
    }

    /**
     * Arrête le mode de sélection active.
     * @param event L'événement souris.
     */
    endSelection(event: any) {
        if (event.button === 0) {
            this.isSelectionActive = false;
        }
    }

    /**
     * Valide et prépare la sauvegarde de la situation (création ou édition).
     */
    saveSituation() {
        // On check si il y a bien un nom à la situation
        if (!this.situation_obj.name) {
            this.commonService.showSwalToast(`Veuillez donner un nom à la situation.`, 'error');
        } else {
            let situation_empty = false;
            this.situation_obj.situations.map(row => {
                row.map(situation => {
                    if (situation.solution === undefined) situation_empty = true;
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
                    const uniqueSolutions = Array.from(new Set(flatArray.map(item => item.solution)));
                    let emptySolutionInput: boolean = false;

                    uniqueSolutions.forEach(solution => {
                        let input = document.getElementById(`input_${solution}`) as HTMLInputElement;
                        if (input && input.value === "") {
                            emptySolutionInput = true;
                        }
                    });
                    // On check si toutes les solutions simple ont bien un nom
                    if (emptySolutionInput) {
                        this.commonService.showSwalToast(`Veuillez donner un nom aux solutions utilisées dans le tableau.`, 'error');
                    } else {
                        this.situation_obj.solutions = this.situation_obj.solutions.filter(solution => uniqueSolutions.includes(solution.id));
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

    /**
     * Appelle le service pour ajouter une nouvelle situation.
     */
    addSituation() {
        this.apiSituation.addSituation(this.situation_obj);
        this.commonService.showSwalToast(`Situation enregistrée !`);
        this.router.navigate(['situations-list-manager']);
    }

    /**
     * Appelle le service pour modifier la situation actuelle.
     */
    editSituation() {
        this.apiSituation.editSituation(this.situation_obj);
        this.commonService.showSwalToast(`Situation modifiée !`);
        this.router.navigate(['situations-list-manager']);
    }

    /**
     * Change la solution active pour l'attribution dans le tableau.
     * @param solutionId Identifiant de la solution choisie.
     */
    onChangeSolution(solutionId: string) {
        this.solutionSelected = solutionId;
    }

    /**
     * Met à jour le nom d'affichage d'une solution.
     * @param solutionId Identifiant de la solution.
     * @param e Événement input.
     */
    onChangeSolutionName(solutionId: string, e: any) {
        const solutionLst = this.situation_obj.solutions.filter(solution => solution.id === solutionId)[0];
        solutionLst.display_name = e.target.value;
    }

    /**
     * Filtre la liste des solutions par type et validité du nom.
     * @param solutionLst Liste complète.
     * @param type Type ('unique' ou 'mixed').
     * @param filterNoDisplayName Si vrai, ignore les solutions sans nom.
     * @returns Liste filtrée.
     */
    filteredSolutionList(solutionLst: Solution[], type: string, filterNoDisplayName: boolean = false) {
        return solutionLst.filter(solution => solution.type === type && (!filterNoDisplayName || (solution.display_name !== undefined && solution.display_name !== '')));
    }

    /**
     * Ouvre l'interface de choix de couleur pour une solution.
     * @param solutionId Identifiant de la solution.
     */
    onColorSolution(solutionId: string) {
        document.getElementById(`color-picker-div_${solutionId}`)?.classList.remove("hidden");
        setTimeout(() => {
            this.listener = (event: any) => {
                if (document.getElementById(`color-picker-div_${solutionId}`) !== event.target) {
                    document.getElementById(`color-picker-div_${solutionId}`)?.classList.add('hidden');
                    document.removeEventListener('click', this.listener);
                    this.listener = null;
                }
            };
            document.addEventListener('click', this.listener);
        }, 0);
    }

    /**
     * Applique une couleur à une solution.
     * @param solutionId Identifiant de la solution.
     * @param color Code couleur choisi.
     */
    onSelectColor(solutionId: string, color: string) {
        let solutionLst = this.situation_obj.solutions.filter(solution => solution.id === solutionId)[0];
        solutionLst.color = color;
        document.getElementById(`color-picker-div_${solutionId}`)?.classList.add("hidden");
        this.situation_objSolutionsRef = this.situation_obj.solutions.slice();
    }

    /**
     * Gère le basculement entre slider simple et multiple selon le nombre de solutions cochées.
     */
    onCheckChange() {
        if (this.multipleSolutionCheckBox.length < 3) {
            this.simpleSlider = true;
            this.multipleSlider = false;
        } else if (this.multipleSolutionCheckBox.length === 3) {
            this.simpleSlider = false;
            this.multipleSlider = true;
        }
    }

    /**
     * Enregistre une solution mixte (plusieurs actions possibles).
     */
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

        const solutionLst: {
            color: string;
            percent?: number | undefined;
        }[] = [];

        this.multipleSolutionCheckBox.map((solution, index) => {
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
                color: solution,
                percent: percent
            }
            solutionLst.push(obj);
        });
        if (userParams.autoMultipleSolutionName) {
            this.multipleSolutionName = "";
            solutionLst.forEach((solutionItem, index) => {
                const solution = this.situation_obj.solutions.find(solution => solution.id === solutionItem.color);
                if (solution) {
                    this.multipleSolutionName += solution.display_name!.replace(/ /g, '_') + '_' + solutionItem.percent;
                    if (index + 1 < solutionLst.length) this.multipleSolutionName += '_';
                }
            });
        } else {
            if (this.multipleSolutionName === "") {
                this.commonService.showSwalToast(`Veuillez donner un nom à la solution multiple.`, 'error');
                return;
            }
        }
        let new_obj = {
            id: this.multipleSituationId ? this.multipleSituationId : `mixed_solution_${this.countMultipleSolution}`,
            type: "mixed",
            display_name: this.multipleSolutionName,
            colorList: solutionLst
        }
        if (this.multipleSituationId) {
            const indexToReplace = this.situation_obj.solutions.findIndex(solution => solution.id === this.multipleSituationId);
            if (indexToReplace !== -1) {
                this.situation_obj.solutions = [
                    ...this.situation_obj.solutions.slice(0, indexToReplace),
                    new_obj,
                    ...(this.situation_obj.solutions.length > 1 ? this.situation_obj.solutions.slice(indexToReplace + 1) : [])
                ];
                // (document.getElementById(`button_${this.multipleSituationId}`) as HTMLInputElement).checked = true;
            }
        } else {
            this.countMultipleSolution++;
            this.situation_obj.solutions.push(new_obj);
        }
        this.situation_objSolutionsRef = this.situation_obj.solutions.slice();
        this.resetMultipleSituation();
    }

    /**
     * Réinitialise le formulaire de création de situation multiple.
     */
    resetMultipleSituation() {
        this.simpleSlider = true;
        this.multipleSlider = false;
        this.mixedSolutionSliderMinValue = 50;
        this.mixedSolutionSliderMaxValue = 100;
        this.multipleSolutionCheckBox = [];
        this.multipleSolutionName = "";
        this.multipleSituationId = undefined;
        this.commonService.closeModal('add-multiples-solutions');
    }

    /**
     * Charge une solution multiple existante pour modification.
     * @param solutionId Identifiant de la solution à édier.
     */
    editMultipleSolution(solutionId: string) {
        const solution: Solution = this.situation_objSolutionsRef.filter((solution: Solution) => solution.id === solutionId)[0];
        this.multipleSituationId = solution.id;
        this.multipleSolutionName = solution.display_name!;
        this.multipleSolutionCheckBox = solution.colorList!.map(solution => solution.color);
        if (solution.colorList?.length === 2) {
            this.mixedSolutionSliderMinValue = solution.colorList[0].percent!;
        } else if (solution.colorList?.length === 3) {
            this.mixedSolutionSliderMinValue = solution.colorList[0].percent!;
            this.mixedSolutionSliderMaxValue = solution.colorList[0].percent! + solution.colorList[1].percent!;
        }

        if (this.multipleSolutionCheckBox.length < 3) {
            this.simpleSlider = true;
            this.multipleSlider = false;
        } else if (this.multipleSolutionCheckBox.length === 3) {
            this.simpleSlider = false;
            this.multipleSlider = true;
        }
        this.commonService.showModal('add-multiples-solutions');
    }

    /**
     * Supprime une solution multiple par son identifiant.
     * @param multipleSolutionId L'identifiant de la solution multiple à supprimer.
     */
    deleteMultipleSolution(multipleSolutionId: string) {
        const solutions = this.situation_obj.solutions;
        const index = solutions.findIndex(solution => solution.id === multipleSolutionId);

        if (index !== -1) {
            solutions.splice(index, 1);
            this.situation_objSolutionsRef = [...solutions];
        }
    }

    /**
     * Met à jour les positions et niveaux disponibles lors du changement du nombre de joueurs.
     */
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
     * Met à jour une propriété simple de la situation.
     * @param property Le nom de la propriété.
     * @param value L'objet contenant la nouvelle valeur (.code).
     */
    onChangeProperty(property: string, value: any) {
        (this.situation_obj as any)[property] = value.code;

        if (property === 'position') {
            this.updateAvailableFishPositions();
        }
    }

    /**
     * Génère automatiquement le nom de la situation en fonction des paramètres actuels.
     */
    generateAutoSituationName() {
        let mode = "";
        let position = this.position.name;
        let stack = (this.situation_obj.stack || 0) + "d";
        let action = "";
        let niveau = this.opponentLevel.name.toUpperCase();

        // 1. Déterminer le MODE
        if (this.nbPlayer.code === 2) {
            mode = "HU";
        } else {
            if (this.previousPlayer1Action.code === 'Fold') {
                mode = "BVB";
            } else {
                mode = "3w";
            }
        }

        // 2. Déterminer l'ACTION
        const isFirstToAct = (this.nbPlayer.code === 2 && this.position.code === 'sb') || 
                            (this.nbPlayer.code === 3 && this.position.code === 'bu');

        if (!isFirstToAct) {
            let lastAction = "Aucune";

            if (this.nbPlayer.code === 2) {
                // HU BB: Action du SB
                lastAction = this.previousPlayer1Action.code;
            } else {
                // 3way
                if (this.position.code === 'sb') {
                    // SB: Action du BU
                    lastAction = this.previousPlayer1Action.code;
                } else if (this.position.code === 'bb') {
                    // BB: Action du SB si pas Fold/Aucune, sinon BU
                    if (this.previousPlayer2Action.code !== 'Fold' && this.previousPlayer2Action.code !== 'Aucune') {
                        lastAction = this.previousPlayer2Action.code;
                    } else {
                        lastAction = this.previousPlayer1Action.code;
                    }
                }
            }

            if (lastAction !== "Aucune" && lastAction !== "Fold") {
                if (lastAction === "Limp" || lastAction === "Call") {
                    action = "vs limp ";
                } else if (lastAction.startsWith("Raise")) {
                    action = "vs open ";
                } else if (lastAction === "All In") {
                    action = "vs OS ";
                }
            }
        }

        // Assemblage final : "MODE POSITION STACKd vs [ACTION] NIVEAU"
        this.situation_obj.name = `${mode} ${position} ${stack} ${action}${niveau}`;
    }

}
