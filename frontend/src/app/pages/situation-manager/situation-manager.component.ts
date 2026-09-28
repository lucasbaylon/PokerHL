import { NgxSliderModule, Options } from '@angular-slider/ngx-slider';
import { NgClass, NgStyle } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { cloneDeep } from 'lodash';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { Subscription } from 'rxjs';
import { AppModalComponent } from '../../components/app-modal/app-modal.component';
import { Situation } from '../../interfaces/situation';
import { Solution, SolutionAction } from '../../interfaces/solution';
import { UserParams } from '../../interfaces/user-params';
import { RangeGridComponent } from '../../components/range-grid/range-grid.component';
import { SolutionColorPipe } from '../../pipes/solution-color.pipe';
import { CommonService } from '../../services/common.service';
import { SituationService } from '../../services/situation.service';

@Component({
    selector: 'app-situation-manager',
    standalone: true,
    imports: [FormsModule, NgStyle, NgClass, SolutionColorPipe, InputNumberModule, DropdownModule, InputTextModule, NgxSliderModule, CheckboxModule, AppModalComponent, RangeGridComponent],
    templateUrl: './situation-manager.component.html'
})
export class SituationManagerComponent {

    mode: string = "new";
    situationSubscription!: Subscription;
    multipleSolutionName: string = "";
    situation_obj!: Situation;
    solutionSelected?: string = "unique_solution_0";
    showOpponent2: boolean = true;
    situation_objSolutionsRef: any;
    mixedSolutionSliderMinValue: number = 50;
    mixedSolutionSliderMaxValue: number = 100;
    simpleSlider: boolean = true;
    multipleSlider: boolean = false;
    countMultipleSolution: number = 0;
    multipleSituationId?: string;
    showMultipleSolutionModal: boolean = false;
    showHelpModal: boolean = false;
    readonly maxRaiseSizes = 3;
    showBrushMenu: boolean = false;
    @ViewChild('brushMenu') brushMenu?: ElementRef<HTMLElement>;
    isSaving: boolean = false;
    showRaiseEditor: boolean = false;
    raiseEditorSolutionId?: string;
    raiseEditorAmount: number | null = 2;
    editSituationName?: string;
    multipleSolutionCheckBox: string[] = [];

    options: Options = {
        floor: 0,
        ceil: 100
    };

    availableSituationType: any[] = [
        { name: 'Pré-flop', code: 'preflop' },
        { name: 'Flop', code: 'flop' }
    ];

    availablePreviousActions: any[] = [
        { name: 'Fold', code: 'Fold' },
        { name: 'Limp', code: 'Limp' },
        { name: 'Call', code: 'Call' },
        { name: 'Raise 2BB', code: 'Raise 2BB' },
        { name: 'Raise 2.5BB', code: 'Raise 2.5BB' },
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

    previousPlayer1Action: { name: string, code: string } = { name: 'Fold', code: 'Fold' };
    
    previousPlayer2Action: { name: string, code: string } = { name: 'Fold', code: 'Fold' };

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
        this.ensureActionSolutions();
        if (this._Activatedroute.snapshot.params["situation_id"]) {
            this.apiSituation.getSituation(this._Activatedroute.snapshot.params["situation_id"]);
        }

        this.situationSubscription = this.apiSituation.situation.subscribe(situation_str => {
            this.mode = "edit";
            this.situation_obj = JSON.parse(situation_str);
            this.commonService.migrateSolutions(this.situation_obj.solutions);
            this.editSituationName = this.situation_obj.name;
            this.ensureActionSolutions();

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
            : { name: 'Fold', code: 'Fold' };

        this.previousPlayer2Action = this.situation_obj.previousPlayer2Action
            ? this.availablePreviousActions.find(act => act.code === this.situation_obj.previousPlayer2Action)
            : { name: 'Fold', code: 'Fold' };

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
     * Garantit qu'une solution simple existe pour chaque action, afin qu'elles soient toutes disponibles dans le pinceau.
     * Les solutions inutilisées sont retirées à l'enregistrement.
     */
    ensureActionSolutions() {
        for (const action of this.commonService.solutionActions) {
            if (!this.situation_obj.solutions.some(solution => solution.type === 'unique' && solution.action === action.code)) {
                this.createUniqueSolution(action.code, action.code === 'raise' ? 2 : undefined);
            }
        }
        this.situation_objSolutionsRef = this.situation_obj.solutions.slice();
        if (!this.selectedSolution) {
            this.solutionSelected = this.uniqueBrushSolutions[0]?.id;
        }
    }

    /**
     * Ajoute une solution simple avec un identifiant libre.
     * @param action Action de la solution.
     * @param raiseAmount Montant en BB pour un raise.
     * @returns La solution créée.
     */
    createUniqueSolution(action: SolutionAction, raiseAmount?: number): Solution {
        const nextIndex = Math.max(-1, ...this.situation_obj.solutions
            .map(solution => Number(solution.id.match(/^unique_solution_(\d+)$/)?.[1] ?? -1))) + 1;
        const solution: Solution = { id: `unique_solution_${nextIndex}`, type: 'unique', display_name: undefined, action, raiseAmount };
        solution.display_name = this.commonService.solutionActionLabel(solution);
        this.situation_obj.solutions.push(solution);
        return solution;
    }

    /**
     * Solutions simples du pinceau, de All-in à Fold, les raises du plus gros au plus petit.
     */
    get uniqueBrushSolutions(): Solution[] {
        // Ordre inverse des actions (All-in en premier) ; actions non reconnues en dernier
        const order = (solution: Solution) => {
            const index = this.commonService.solutionActions.findIndex(action => action.code === solution.action);
            return index === -1 ? -1 : index;
        };
        return this.filteredSolutionList(this.situation_obj.solutions, 'unique')
            .sort((a, b) => order(b) - order(a) || (b.raiseAmount ?? 0) - (a.raiseAmount ?? 0));
    }

    private brushOptionsCache?: { ref: Solution[], options: Solution[] };

    /**
     * Options du sélecteur de pinceau : solutions simples puis mixtes.
     * Mémorisées tant que la liste des solutions ne change pas, pour ne pas recréer les options du dropdown à chaque rendu.
     */
    get brushOptions(): Solution[] {
        if (this.brushOptionsCache?.ref !== this.situation_objSolutionsRef) {
            this.brushOptionsCache = {
                ref: this.situation_objSolutionsRef,
                options: [...this.uniqueBrushSolutions, ...this.filteredSolutionList(this.situation_obj.solutions, 'mixed')]
            };
        }
        return this.brushOptionsCache!.options;
    }

    get raiseCount(): number {
        return this.situation_obj.solutions.filter(solution => solution.type === 'unique' && solution.action === 'raise').length;
    }

    /**
     * Ouvre l'éditeur de taille de raise.
     * @param solution Raise à modifier, ou rien pour en ajouter un.
     */
    openRaiseEditor(solution?: Solution) {
        this.raiseEditorSolutionId = solution?.id;
        if (solution) {
            this.raiseEditorAmount = solution.raiseAmount ?? 2;
        } else {
            const amounts = this.situation_obj.solutions.filter(item => item.action === 'raise').map(item => item.raiseAmount ?? 0);
            this.raiseEditorAmount = amounts.length ? Math.max(...amounts) + 0.5 : 2;
        }
        this.showRaiseEditor = true;
    }

    closeRaiseEditor() {
        this.showRaiseEditor = false;
        this.raiseEditorSolutionId = undefined;
    }

    /**
     * Crée ou modifie un raise avec le montant saisi, puis le sélectionne dans le pinceau.
     */
    saveRaiseEditor() {
        const amount = this.raiseEditorAmount;
        if (amount == null || !(amount > 0)) {
            this.commonService.showSwalToast('Veuillez saisir un montant de raise valide.', 'error');
            return;
        }
        const duplicate = this.situation_obj.solutions.find(solution =>
            solution.type === 'unique' && solution.action === 'raise' && solution.raiseAmount === amount && solution.id !== this.raiseEditorSolutionId);
        if (duplicate) {
            this.commonService.showSwalToast(`Un raise de ${amount} BB existe déjà.`, 'error');
            return;
        }

        let solution = this.situation_obj.solutions.find(item => item.id === this.raiseEditorSolutionId);
        if (solution) {
            solution.raiseAmount = amount;
            solution.display_name = this.commonService.solutionActionLabel(solution);
        } else {
            solution = this.createUniqueSolution('raise', amount);
        }
        this.situation_objSolutionsRef = this.situation_obj.solutions.slice();
        this.solutionSelected = solution.id;
        this.closeRaiseEditor();
    }

    /**
     * Supprime le raise en cours d'édition et vide les cases qui l'utilisaient.
     */
    deleteRaise() {
        const solutionId = this.raiseEditorSolutionId;
        if (!solutionId) return;
        const usedInMixed = this.situation_obj.solutions.some(solution =>
            solution.type === 'mixed' && solution.colorList?.some(item => item.color === solutionId));
        if (usedInMixed) {
            this.commonService.showSwalToast('Ce raise est utilisé dans une solution mixte. Modifiez-la avant de le supprimer.', 'error');
            return;
        }
        this.situation_obj.situations.forEach(row => row.forEach(cell => {
            if (cell.solution === solutionId) cell.solution = undefined;
        }));
        this.situation_obj.solutions = this.situation_obj.solutions.filter(solution => solution.id !== solutionId);
        this.situation_objSolutionsRef = this.situation_obj.solutions.slice();
        if (this.solutionSelected === solutionId) {
            this.solutionSelected = this.uniqueBrushSolutions[0]?.id;
        }
        this.closeRaiseEditor();
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
                if (this.situation_obj.stack == null) {
                    this.commonService.showSwalToast(`Veuillez remplir le champ "Stack effectif".`, 'error');
                } else {
                    const flatArray = this.situation_obj.situations.flat();
                    const uniqueSolutions = Array.from(new Set(flatArray.map(item => item.solution)));
                    let invalidSolution = false;

                    uniqueSolutions.forEach(solution => {
                        const selectedSolution = this.situation_obj.solutions.find(item => item.id === solution);
                        if (selectedSolution?.type === 'unique' && (!selectedSolution.action || (selectedSolution.action === 'raise' && !(selectedSolution.raiseAmount! > 0)))) {
                            invalidSolution = true;
                        }
                    });
                    // On check si toutes les solutions simple ont bien un nom
                    if (invalidSolution) {
                        this.commonService.showSwalToast(`Veuillez sélectionner une action et un montant valide pour chaque relance utilisée.`, 'error');
                    } else {
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
    async addSituation() {
        if (this.isSaving) return;
        this.isSaving = true;
        const saved = await this.apiSituation.addSituation(this.situationToSave());
        this.isSaving = false;
        if (!saved) {
            this.commonService.showSwalToast(`La situation n'a pas pu être enregistrée. Veuillez réessayer.`, 'error');
            return;
        }
        this.commonService.showSwalToast(`Situation enregistrée !`);
        this.router.navigate(['situations']);
    }

    /**
     * Appelle le service pour modifier la situation actuelle.
     */
    async editSituation() {
        if (this.isSaving) return;
        this.isSaving = true;
        const saved = await this.apiSituation.editSituation(this.situationToSave());
        this.isSaving = false;
        if (!saved) {
            this.commonService.showSwalToast(`La situation n'a pas pu être modifiée. Veuillez réessayer.`, 'error');
            return;
        }
        this.commonService.showSwalToast(`Situation modifiée !`);
        this.router.navigate(['situations']);
    }

    /**
     * Copie de la situation à envoyer au serveur, sans les solutions inutilisées.
     * Une solution est conservée si elle est peinte dans le tableau ou si elle compose une solution mixte peinte.
     * La situation éditée n'est pas modifiée : en cas d'échec, toutes les actions restent dans le pinceau.
     */
    situationToSave(): Situation {
        const usedSolutionIds = new Set<string | undefined>(this.situation_obj.situations.flat().map(cell => cell.solution));
        this.situation_obj.solutions
            .filter(solution => solution.type === 'mixed' && usedSolutionIds.has(solution.id))
            .forEach(solution => solution.colorList?.forEach(item => usedSolutionIds.add(item.color)));
        return {
            ...this.situation_obj,
            solutions: this.situation_obj.solutions.filter(solution => usedSolutionIds.has(solution.id))
        };
    }

    /**
     * Ferme le menu du pinceau lors d'un clic en dehors.
     * (Un fond `fixed` ne couvre pas toute la page ici : la carte animée a un `transform`.)
     */
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (this.showBrushMenu && !this.brushMenu?.nativeElement.contains(event.target as Node)) {
            this.showBrushMenu = false;
        }
    }

    /**
     * Retourne à la liste des situations sans enregistrer.
     */
    backToSituations() {
        this.router.navigate(['situations']);
    }

    /**
     * Solution actuellement sélectionnée pour l'attribution dans le tableau.
     */
    get selectedSolution(): Solution | undefined {
        return this.situation_obj?.solutions.find(solution => solution.id === this.solutionSelected);
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
     * Retourne le nombre de solutions d'un type donné.
     */
    solutionCount(type: string): number {
        return this.filteredSolutionList(this.situation_obj.solutions, type).length;
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
     * Segments du slider de solution mixte : action, couleur et pourcentage de chaque solution cochée.
     */
    mixedSliderSegments(): { name: string, color: string, percent: number }[] {
        const solutions = this.multipleSolutionCheckBox
            .map(solutionId => this.situation_obj.solutions.find(solution => solution.id === solutionId))
            .filter((solution): solution is Solution => !!solution);
        if (solutions.length < 2) return [];

        const percents = solutions.length === 2
            ? [this.mixedSolutionSliderMinValue, 100 - this.mixedSolutionSliderMinValue]
            : [this.mixedSolutionSliderMinValue, this.mixedSolutionSliderMaxValue - this.mixedSolutionSliderMinValue, 100 - this.mixedSolutionSliderMaxValue];
        return solutions.map((solution, index) => ({
            name: solution.display_name || 'Action non définie',
            color: this.commonService.solutionColor(solution, this.situation_obj.solutions),
            percent: percents[index] ?? 0
        }));
    }

    /**
     * Construit la piste colorée du slider selon les solutions cochées.
     */
    mixedSliderGradient(): string {
        const selectedColors = this.multipleSolutionCheckBox
            .map(solutionId => this.situation_obj.solutions.find(solution => solution.id === solutionId))
            .filter((solution): solution is Solution => !!solution)
            .map(solution => this.commonService.solutionColor(solution, this.situation_obj.solutions));

        if (selectedColors.length < 2) {
            return 'linear-gradient(to right, #e5e7eb 0%, #e5e7eb 100%)';
        }

        if (selectedColors.length === 2) {
            const split = this.mixedSolutionSliderMinValue;
            return `linear-gradient(to right, ${selectedColors[0]} 0%, ${selectedColors[0]} ${split}%, ${selectedColors[1]} ${split}%, ${selectedColors[1]} 100%)`;
        }

        const firstSplit = this.mixedSolutionSliderMinValue;
        const secondSplit = this.mixedSolutionSliderMaxValue;
        return `linear-gradient(to right, ${selectedColors[0]} 0%, ${selectedColors[0]} ${firstSplit}%, ${selectedColors[1]} ${firstSplit}%, ${selectedColors[1]} ${secondSplit}%, ${selectedColors[2]} ${secondSplit}%, ${selectedColors[2]} 100%)`;
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
                percent = this.multipleSolutionCheckBox.length === 2
                    ? 100 - this.mixedSolutionSliderMinValue
                    : 100 - this.mixedSolutionSliderMaxValue;
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
                this.commonService.showSwalToast(`Veuillez donner un nom à la solution mixte.`, 'error');
                return;
            }
        }
        let new_obj = {
            id: this.multipleSituationId ? this.multipleSituationId : this.nextMixedSolutionId(),
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
     * Identifiant libre pour une nouvelle solution mixte.
     */
    nextMixedSolutionId(): string {
        const nextIndex = Math.max(-1, ...this.situation_obj.solutions
            .map(solution => Number(solution.id.match(/^mixed_solution_(\d+)$/)?.[1] ?? -1))) + 1;
        return `mixed_solution_${nextIndex}`;
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
        this.showMultipleSolutionModal = false;
    }

    /**
     * Charge une solution mixte existante pour modification.
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
        this.showMultipleSolutionModal = true;
    }

    /**
     * Supprime une solution mixte par son identifiant.
     * @param multipleSolutionId L'identifiant de la solution mixte à supprimer.
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
            let lastAction = "Fold";

            if (this.nbPlayer.code === 2) {
                // HU BB: Action du SB
                lastAction = this.previousPlayer1Action.code;
            } else {
                // 3way
                if (this.position.code === 'sb') {
                    // SB: Action du BU
                    lastAction = this.previousPlayer1Action.code;
                } else if (this.position.code === 'bb') {
                    // BB: Action du SB si pas Fold, sinon BU
                    if (this.previousPlayer2Action.code !== 'Fold') {
                        lastAction = this.previousPlayer2Action.code;
                    } else {
                        lastAction = this.previousPlayer1Action.code;
                    }
                }
            }

            if (lastAction !== "Fold") {
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
