import { NgxSliderModule, Options } from '@angular-slider/ngx-slider';
import { NgClass, NgStyle, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { cloneDeep } from 'lodash';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { Subscription } from 'rxjs';
import { AppModalComponent } from '../../components/app-modal/app-modal.component';
import { FlopConditionDialogComponent } from '../../components/flop-condition-dialog/flop-condition-dialog.component';
import { FlopRulesEditorComponent } from '../../components/flop-rules-editor/flop-rules-editor.component';
import { ACTION_LINE_ACTIONS, ACTION_LINE_STREETS, ActionLineStep, HeroSpot, IN_RANGE, Situation, isPostflop as isPostflopType } from '../../interfaces/situation';
import { Solution, SolutionAction } from '../../interfaces/solution';
import { UserParams } from '../../interfaces/user-params';
import { RangeGridComponent } from '../../components/range-grid/range-grid.component';
import { SolutionColorPipe } from '../../pipes/solution-color.pipe';
import { CommonService } from '../../services/common.service';
import { BoardFilter, BoardSuitsFilter, FLOP_TYPES, FlopCard, FlopService, FlopType, FlopTypeInfo, Street } from '../../services/flop.service';
import { RuleCondition, describeCondition, describeHand, resolveAction } from '../../services/flop-rules';
import { evaluateHand } from '../../services/hand-evaluator';
import { SituationService } from '../../services/situation.service';

/** Listes de conditions de board d'une situation postflop, par street. */
type BoardConditionList = 'boardConditions' | 'turnConditions' | 'riverConditions';

/** Streets de la ligne d'action pour chaque street de situation (listes stables pour les dropdowns). */
const ACTION_LINE_STREETS_BEFORE: Record<Street, typeof ACTION_LINE_STREETS> = {
    flop: ACTION_LINE_STREETS.slice(0, 1),
    turn: ACTION_LINE_STREETS.slice(0, 2),
    river: ACTION_LINE_STREETS.slice(0, 3)
};

/** Nombre de boards évalués pour vérifier, à l'enregistrement, qu'un board turn ou river existe. */
const VALIDATION_BOARD_BUDGET = 300000;

@Component({
    selector: 'app-situation-manager',
    standalone: true,
    imports: [FormsModule, NgStyle, NgClass, NgTemplateOutlet, SolutionColorPipe, InputNumberModule, DropdownModule, InputTextModule, MultiSelectModule, NgxSliderModule, CheckboxModule, AppModalComponent, RangeGridComponent, FlopRulesEditorComponent, FlopConditionDialogComponent],
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
    @ViewChild('characteristicsGrid') characteristicsGrid?: ElementRef<HTMLElement>;
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
        { name: 'Flop', code: 'flop' },
        { name: 'Turn', code: 'turn' },
        { name: 'River', code: 'river' }
    ];

    readonly flopTypes: FlopTypeInfo[] = FLOP_TYPES;
    exampleFlop: FlopCard[] = [];
    flopPoolSize = 0;
    readonly suitSymbols: Record<string, string> = { heart: '♥', diamond: '♦', club: '♣', spade: '♠' };
    readonly describeCondition = describeCondition;

    readonly boardSuitsOptions: { name: string, code: BoardSuitsFilter }[] = [
        { name: 'Indifférent', code: 'any' },
        { name: 'Arc-en-ciel (sans tirage couleur)', code: 'rainbow' },
        { name: 'Two-tone (tirage couleur)', code: 'twoTone' },
        { name: 'Monotone', code: 'mono' }
    ];

    readonly heroSpotOptions: { name: string, code: HeroSpot }[] = [
        { name: 'Premier à parler / checké', code: 'first' },
        { name: 'Face à une mise', code: 'facingBet' }
    ];

    /** Pinceau de la range flop : une seule « solution » pour marquer les mains de la range. */
    readonly rangeSolutions: Solution[] = [{ id: IN_RANGE, type: 'unique', display_name: 'Dans la range', color: '#16a34a' }];
    readonly inRange = IN_RANGE;
    rangeBrush: 'add' | 'remove' = 'add';

    boardConditionDialogOpen = false;
    editedBoardConditionIndex?: number;
    /** Liste de conditions de board en cours d'édition : flop, turn ou river. */
    editedBoardList: BoardConditionList = 'boardConditions';

    readonly actionLineActors: { name: string, code: ActionLineStep['actor'] }[] = [
        { name: 'Héros', code: 'hero' }, { name: 'Adversaire', code: 'villain' }
    ];
    readonly actionLineActions = ACTION_LINE_ACTIONS;

    testResult?: { hero: FlopCard[], board: FlopCard[], hand: string[], rule: string, action?: Solution };

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
        private flopService: FlopService,
        private changeDetector: ChangeDetectorRef,
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
            if (this.isPostflop) this.initializeFlopFields();
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

        this.refreshFlopPool();
    }

    /** Situation postflop (flop, turn ou river) : range, board, pot et règles d'action. */
    get isPostflop(): boolean {
        return isPostflopType(this.situation_obj.type);
    }

    /** Street de la situation postflop (flop par défaut). */
    get street(): Street {
        return this.isPostflop ? this.situation_obj.type as Street : 'flop';
    }

    /** Situation turn ou river : conditions sur la turn (et la river) en plus du filtre du flop. */
    get hasTurn(): boolean {
        return this.street !== 'flop';
    }

    get hasRiver(): boolean {
        return this.street === 'river';
    }

    /** Street avec son article : « au flop », « au turn », « à la river ». */
    get streetArrival(): string {
        return { flop: 'au flop', turn: 'au turn', river: 'à la river' }[this.street];
    }

    get potLabel(): string {
        return `Pot ${this.streetArrival}`;
    }

    get isFacingBet(): boolean {
        return this.isPostflop && this.situation_obj.heroSpot === 'facingBet';
    }

    /**
     * Complète les champs d'une situation postflop et migre l'ancien format (un seul type de flop, grille peinte d'actions).
     */
    initializeFlopFields() {
        const situation = this.situation_obj;
        situation.flopTypes ??= situation.flopType ? [situation.flopType] : [this.flopTypes[0].code];
        delete situation.flopType;
        situation.boardSuits ??= 'any';
        situation.boardConditions ??= [];
        situation.turnConditions ??= [];
        situation.riverConditions ??= [];
        situation.actionLine ??= [];
        situation.heroSpot ??= 'first';
        situation.rules ??= [];
        situation.situations.forEach(row => row.forEach(cell => {
            if (cell.solution) cell.solution = IN_RANGE;
        }));
    }

    /**
     * Action dont la taille est réglable : raise en BB au préflop, bet en % du pot au flop,
     * raise en multiple de la mise adverse au flop face à une mise.
     */
    get sizeAction(): 'raise' | 'bet' {
        return this.isPostflop && !this.isFacingBet ? 'bet' : 'raise';
    }

    get sizeUnit(): string {
        if (!this.isPostflop) return 'BB';
        return this.isFacingBet ? 'x' : '%';
    }

    /**
     * Taille d'une solution : montant en BB ou multiple de la mise pour un raise, pourcentage du pot pour un bet.
     */
    solutionSize(solution: Solution): number | undefined {
        return solution.action === 'bet' ? solution.betPercent : solution.raiseMultiplier ?? solution.raiseAmount;
    }

    /**
     * Indique si une solution est utilisable pour le type et le spot actuels.
     */
    private isSolutionAllowed(solution: Solution): boolean {
        if (solution.type === 'mixed') return !this.isPostflop;
        const allowed = this.commonService.actionsForType(this.situation_obj.type, this.situation_obj.heroSpot);
        if (!solution.action || !allowed.some(action => action.code === solution.action)) return false;
        // Un raise au flop s'exprime en multiple de la mise, au préflop en BB
        return solution.action !== 'raise' || (solution.raiseMultiplier != null) === this.isPostflop;
    }

    /**
     * Change le type de situation : retire les actions non disponibles pour ce type et vide les cases qui les utilisaient.
     */
    onChangeSituationType() {
        this.withCharacteristicsAnimation(() => this.applySituationType());
    }

    /**
     * Changement du nombre de joueurs par l'utilisateur : les champs d'action précédente peuvent apparaître ou disparaître.
     */
    onSelectNbPlayers() {
        this.withCharacteristicsAnimation(() => this.onChangeNbPlayersTable());
    }

    /**
     * Changement de position par l'utilisateur : les champs d'action précédente peuvent apparaître ou disparaître.
     */
    onSelectPosition() {
        this.withCharacteristicsAnimation(() => this.onChangeProperty('position', this.position));
    }

    /**
     * Applique un changement qui ajoute ou retire des champs, puis anime la hauteur de la grille des caractéristiques
     * de l'ancienne à la nouvelle valeur.
     * @param apply Changement à appliquer.
     */
    private withCharacteristicsAnimation(apply: () => void) {
        const grid = this.characteristicsGrid?.nativeElement;
        const previousHeight = grid?.offsetHeight;
        apply();
        if (!grid || previousHeight == null) return;

        this.changeDetector.detectChanges();
        const nextHeight = grid.offsetHeight;
        if (nextHeight !== previousHeight && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            grid.animate(
                [{ height: `${previousHeight}px`, overflow: 'hidden' }, { height: `${nextHeight}px`, overflow: 'hidden' }],
                { duration: 300, easing: 'ease-in-out' }
            );
        }
    }

    /**
     * Change le type de situation. La grille préflop devient la range du flop ; au retour au préflop, la range est vidée.
     */
    private applySituationType() {
        const wasFlop = this.isPostflop;
        this.situation_obj.type = this.situationType.code;
        if (this.isPostflop && !wasFlop) {
            this.initializeFlopFields();
        } else if (!this.isPostflop && wasFlop) {
            this.situation_obj.situations.forEach(row => row.forEach(cell => cell.solution = undefined));
        }
        this.applyAllowedActions();
        this.refreshFlopPool();
    }

    /**
     * Changement de spot du héros au flop : les actions disponibles changent.
     */
    onChangeHeroSpot() {
        this.withCharacteristicsAnimation(() => {
            if (this.isFacingBet) this.situation_obj.facingBetPercent ??= 50;
            this.applyAllowedActions();
        });
    }

    /**
     * Retire les actions non disponibles pour le type et le spot actuels, vide les cases et règles qui les utilisaient,
     * puis ajoute les actions manquantes.
     */
    private applyAllowedActions() {
        const removedIds = new Set(this.situation_obj.solutions
            .filter(solution => solution.type === 'unique' && !this.isSolutionAllowed(solution))
            .map(solution => solution.id));
        this.situation_obj.solutions
            .filter(solution => solution.type === 'mixed' && (!this.isSolutionAllowed(solution) || solution.colorList?.some(item => removedIds.has(item.color))))
            .forEach(solution => removedIds.add(solution.id));

        let clearedCells = 0;
        this.situation_obj.situations.forEach(row => row.forEach(cell => {
            if (cell.solution && removedIds.has(cell.solution)) {
                cell.solution = undefined;
                clearedCells++;
            }
        }));
        this.situation_obj.rules?.forEach(rule => {
            if (rule.solutionId && removedIds.has(rule.solutionId)) rule.solutionId = undefined;
        });
        if (this.situation_obj.defaultSolutionId && removedIds.has(this.situation_obj.defaultSolutionId)) {
            this.situation_obj.defaultSolutionId = undefined;
        }
        this.situation_obj.solutions = this.situation_obj.solutions.filter(solution => !removedIds.has(solution.id));
        if (this.solutionSelected && removedIds.has(this.solutionSelected)) this.solutionSelected = undefined;
        this.countMultipleSolution = this.solutionCount('mixed');
        this.ensureActionSolutions();
        if (clearedCells > 0) {
            this.commonService.showSwalToast(`${clearedCells} case(s) vidée(s) : leurs actions ne sont pas disponibles pour ce type.`, 'warning');
        }
    }

    get selectedFlopTypes(): FlopType[] {
        return this.situation_obj.flopTypes ?? [];
    }

    set selectedFlopTypes(types: FlopType[]) {
        this.situation_obj.flopTypes = types;
    }

    /**
     * Filtre des boards de la situation : flop, puis conditions sur la turn et la river selon la street.
     */
    private get boardFilter(): BoardFilter {
        return {
            flopTypes: this.situation_obj.flopTypes ?? [],
            boardSuits: this.situation_obj.boardSuits,
            boardConditions: this.situation_obj.boardConditions,
            turnConditions: this.hasTurn ? this.situation_obj.turnConditions : [],
            riverConditions: this.hasRiver ? this.situation_obj.riverConditions : []
        };
    }

    /**
     * Recalcule le nombre de flops correspondant au filtre et tire un nouvel exemple.
     */
    refreshFlopPool() {
        this.flopPoolSize = this.isPostflop ? this.flopService.flopPool(this.boardFilter).length : 0;
        this.refreshExampleFlop();
    }

    /**
     * Tire un nouvel exemple de board (flop, turn ou river) correspondant au filtre.
     */
    refreshExampleFlop() {
        this.exampleFlop = this.isPostflop ? this.flopService.randomBoard(this.boardFilter, this.street) : [];
    }

    /**
     * Ouvre le dialogue de condition de board : ajout, ou modification de la condition d'index donné.
     * @param list Liste de conditions : flop, turn ou river.
     * @param index Condition à modifier.
     */
    openBoardCondition(list: BoardConditionList, index?: number) {
        this.editedBoardList = list;
        this.editedBoardConditionIndex = index;
        this.boardConditionDialogOpen = true;
    }

    /** Street évaluée par la liste de conditions en cours d'édition. */
    get editedBoardStreet(): Street {
        return ({ boardConditions: 'flop', turnConditions: 'turn', riverConditions: 'river' } as const)[this.editedBoardList];
    }

    get editedBoardCondition(): RuleCondition | undefined {
        return this.editedBoardConditionIndex === undefined ? undefined : this.situation_obj[this.editedBoardList]?.[this.editedBoardConditionIndex];
    }

    onBoardConditionSaved(condition: RuleCondition) {
        const conditions = this.situation_obj[this.editedBoardList] ??= [];
        if (this.editedBoardConditionIndex === undefined) conditions.push(condition);
        else conditions[this.editedBoardConditionIndex] = condition;
        this.closeBoardConditionDialog();
        this.refreshFlopPool();
    }

    /** Conditions d'une liste de board (flop, turn ou river). */
    boardConditionList(list: BoardConditionList): RuleCondition[] {
        return this.situation_obj[list] ?? [];
    }

    removeBoardCondition(list: BoardConditionList, index: number) {
        this.situation_obj[list]?.splice(index, 1);
        this.refreshFlopPool();
    }

    /** Streets proposées dans la ligne d'action : celles qui précèdent la street de la situation. */
    get actionLineStreets() {
        return ACTION_LINE_STREETS_BEFORE[this.street];
    }

    /**
     * Ajoute une action à la ligne d'action, sur la dernière street précédant la situation.
     */
    addActionStep() {
        const line = this.situation_obj.actionLine ??= [];
        const previous = line[line.length - 1];
        line.push({ street: previous?.street ?? this.actionLineStreets[this.actionLineStreets.length - 1].code, actor: previous?.actor === 'hero' ? 'villain' : 'hero', action: 'check' });
    }

    removeActionStep(index: number) {
        this.situation_obj.actionLine?.splice(index, 1);
    }

    /** Taille d'une action de la ligne : % du pot pour un bet, multiplicateur pour un raise. */
    actionStepHasSize(step: ActionLineStep): boolean {
        return step.action === 'bet' || step.action === 'raise';
    }

    closeBoardConditionDialog() {
        this.boardConditionDialogOpen = false;
        this.editedBoardConditionIndex = undefined;
    }

    /**
     * Mains de la range flop ('AA', 'AKs', 'AKo').
     */
    get rangeHands(): string[] {
        return this.situation_obj.situations.flat().filter(cell => cell.solution === IN_RANGE).map(cell => cell.card);
    }

    /**
     * Ajoute ou retire toutes les mains de la range.
     */
    setWholeRange(inRange: boolean) {
        this.situation_obj.situations.forEach(row => row.forEach(cell => cell.solution = inRange ? IN_RANGE : undefined));
    }

    /**
     * Actions proposées dans les règles flop, avec leurs tailles.
     */
    get flopActions(): Solution[] {
        return this.uniqueBrushSolutions;
    }

    /**
     * Tire une main de la range et un flop, puis affiche l'analyse de la main et la règle déclenchée.
     */
    testRules() {
        const hero = this.flopService.randomHeroHand(this.rangeHands);
        if (!hero.length) {
            this.commonService.showSwalToast('Ajoutez des mains à la range pour tester les règles.', 'error');
            return;
        }
        const board = this.flopService.randomBoard(this.boardFilter, this.street, hero);
        if (!board.length) {
            this.commonService.showSwalToast('Aucun board ne correspond aux critères.', 'error');
            return;
        }
        const hand = evaluateHand(hero, board);
        const { solutionId, ruleIndex } = resolveAction(this.situation_obj.rules ?? [], this.situation_obj.defaultSolutionId, hand);
        this.testResult = {
            hero,
            board,
            hand: describeHand(hand),
            rule: ruleIndex === -1 ? 'Aucune règle : action « Sinon »' : `Règle ${ruleIndex + 1}`,
            action: this.situation_obj.solutions.find(solution => solution.id === solutionId)
        };
    }

    isRedSuit(card: FlopCard): boolean {
        return card.color === 'heart' || card.color === 'diamond';
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
        const defaultSizes: Partial<Record<SolutionAction, number>> = { raise: this.isPostflop ? 3 : 2, bet: 33 };
        for (const action of this.commonService.actionsForType(this.situation_obj.type, this.situation_obj.heroSpot)) {
            if (!this.situation_obj.solutions.some(solution => solution.type === 'unique' && solution.action === action.code)) {
                this.createUniqueSolution(action.code, defaultSizes[action.code]);
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
     * @param size Montant en BB pour un raise préflop, multiple de la mise pour un raise au flop, pourcentage du pot pour un bet.
     * @returns La solution créée.
     */
    createUniqueSolution(action: SolutionAction, size?: number): Solution {
        const nextIndex = Math.max(-1, ...this.situation_obj.solutions
            .map(solution => Number(solution.id.match(/^unique_solution_(\d+)$/)?.[1] ?? -1))) + 1;
        const solution: Solution = { id: `unique_solution_${nextIndex}`, type: 'unique', display_name: undefined, action };
        this.setSolutionSize(solution, size);
        solution.display_name = this.commonService.solutionActionLabel(solution);
        this.situation_obj.solutions.push(solution);
        return solution;
    }

    /**
     * Solutions simples du pinceau, de All-in à Fold, les raises (ou bets) du plus gros au plus petit.
     */
    get uniqueBrushSolutions(): Solution[] {
        // Ordre inverse des actions (All-in en premier) ; actions non reconnues en dernier
        const order = (solution: Solution) => {
            const index = this.commonService.solutionActions.findIndex(action => action.code === solution.action);
            return index === -1 ? -1 : index;
        };
        return this.filteredSolutionList(this.situation_obj.solutions, 'unique')
            .sort((a, b) => order(b) - order(a) || (this.solutionSize(b) ?? 0) - (this.solutionSize(a) ?? 0));
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

    /**
     * Enregistre la taille d'une solution dans le champ adapté à son action et au type de situation.
     */
    private setSolutionSize(solution: Solution, size?: number) {
        if (size == null) return;
        if (solution.action === 'bet') solution.betPercent = size;
        else if (solution.action === 'raise' && this.isPostflop) solution.raiseMultiplier = size;
        else if (solution.action === 'raise') solution.raiseAmount = size;
    }

    get raiseCount(): number {
        return this.situation_obj.solutions.filter(solution => solution.type === 'unique' && solution.action === this.sizeAction).length;
    }

    /**
     * Ouvre l'éditeur de taille de raise (préflop) ou de bet (flop).
     * @param solution Raise ou bet à modifier, ou rien pour en ajouter un.
     */
    openRaiseEditor(solution?: Solution) {
        this.raiseEditorSolutionId = solution?.id;
        const isBet = this.sizeAction === 'bet';
        let defaultSize = 2;
        if (this.isPostflop) defaultSize = isBet ? 33 : 3;
        if (solution) {
            this.raiseEditorAmount = this.solutionSize(solution) ?? defaultSize;
        } else {
            const amounts = this.situation_obj.solutions.filter(item => item.action === this.sizeAction).map(item => this.solutionSize(item) ?? 0);
            const step = isBet ? 25 : 0.5;
            this.raiseEditorAmount = amounts.length ? Math.max(...amounts) + step : defaultSize;
        }
        this.showRaiseEditor = true;
    }

    closeRaiseEditor() {
        this.showRaiseEditor = false;
        this.raiseEditorSolutionId = undefined;
    }

    /**
     * Crée ou modifie un raise (ou bet) avec la taille saisie, puis le sélectionne dans le pinceau.
     */
    saveRaiseEditor() {
        const amount = this.raiseEditorAmount;
        const action = this.sizeAction;
        if (amount == null || !(amount > 0)) {
            this.commonService.showSwalToast(`Veuillez saisir une taille de ${action} valide.`, 'error');
            return;
        }
        const duplicate = this.situation_obj.solutions.find(solution =>
            solution.type === 'unique' && solution.action === action && this.solutionSize(solution) === amount && solution.id !== this.raiseEditorSolutionId);
        if (duplicate) {
            this.commonService.showSwalToast(`Un ${action} de ${amount} ${this.sizeUnit} existe déjà.`, 'error');
            return;
        }

        let solution = this.situation_obj.solutions.find(item => item.id === this.raiseEditorSolutionId);
        if (solution) {
            this.setSolutionSize(solution, amount);
            solution.display_name = this.commonService.solutionActionLabel(solution);
        } else {
            solution = this.createUniqueSolution(action, amount);
        }
        this.situation_objSolutionsRef = this.situation_obj.solutions.slice();
        this.solutionSelected = solution.id;
        this.closeRaiseEditor();
    }

    /**
     * Supprime le raise (ou bet) en cours d'édition et vide les cases qui l'utilisaient.
     */
    deleteRaise() {
        const solutionId = this.raiseEditorSolutionId;
        if (!solutionId) return;
        const usedInMixed = this.situation_obj.solutions.some(solution =>
            solution.type === 'mixed' && solution.colorList?.some(item => item.color === solutionId));
        if (usedInMixed) {
            this.commonService.showSwalToast(`Ce ${this.sizeAction} est utilisé dans une solution mixte. Modifiez-la avant de le supprimer.`, 'error');
            return;
        }
        this.situation_obj.situations.forEach(row => row.forEach(cell => {
            if (cell.solution === solutionId) cell.solution = undefined;
        }));
        this.situation_obj.rules?.forEach(rule => {
            if (rule.solutionId === solutionId) rule.solutionId = undefined;
        });
        if (this.situation_obj.defaultSolutionId === solutionId) this.situation_obj.defaultSolutionId = undefined;
        this.situation_obj.solutions = this.situation_obj.solutions.filter(solution => solution.id !== solutionId);
        this.situation_objSolutionsRef = this.situation_obj.solutions.slice();
        if (this.solutionSelected === solutionId) {
            this.solutionSelected = this.uniqueBrushSolutions[0]?.id;
        }
        this.closeRaiseEditor();
    }

    /**
     * Premier problème qui empêche d'enregistrer la situation, ou rien si elle est valide.
     */
    private validationError(): string | undefined {
        const situation = this.situation_obj;
        if (!situation.name) return 'Veuillez donner un nom à la situation.';
        if (situation.stack == null) return 'Veuillez remplir le champ "Stack effectif".';
        const invalidSize = (solution?: Solution) => solution?.type === 'unique' && (!solution.action
            || (solution.action === 'raise' && !((solution.raiseMultiplier ?? solution.raiseAmount)! > 0))
            || (solution.action === 'bet' && !(solution.betPercent! > 0)));

        if (!this.isPostflop) {
            if (situation.situations.flat().some(cell => cell.solution === undefined)) return 'Veuillez remplir toutes les cases du tableau des ranges.';
            const usedIds = new Set(situation.situations.flat().map(cell => cell.solution));
            if (situation.solutions.some(solution => usedIds.has(solution.id) && invalidSize(solution))) {
                return 'Veuillez sélectionner une action et un montant valide pour chaque relance utilisée.';
            }
            return undefined;
        }

        if (!situation.flopTypes?.length) return 'Veuillez choisir au moins un type de flop.';
        if (!this.flopPoolSize) return 'Aucun flop ne correspond aux critères du board.';
        if (this.hasTurn && !this.flopService.randomBoard(this.boardFilter, this.street, [], VALIDATION_BOARD_BUDGET).length) {
            return `Aucun board ne correspond aux conditions ${this.hasRiver ? 'de la turn et de la river' : 'de la turn'}.`;
        }
        const incompleteStep = (situation.actionLine ?? []).findIndex(step => this.actionStepHasSize(step) && !(step.size! > 0));
        if (incompleteStep !== -1) return `Veuillez indiquer la taille de l'action ${incompleteStep + 1} de la ligne d'action.`;
        if (!(situation.pot! > 0)) return 'Veuillez remplir le champ "Pot".';
        if (this.isFacingBet && !(situation.facingBetPercent! > 0)) return 'Veuillez indiquer la mise adverse (% du pot).';
        if (!this.rangeHands.length) return 'Veuillez ajouter au moins une main à la range.';
        const rules = situation.rules ?? [];
        const emptyRule = rules.findIndex(rule => !rule.conditions.length);
        if (emptyRule !== -1) return `La règle ${emptyRule + 1} n'a aucune condition.`;
        const noAction = rules.findIndex(rule => !situation.solutions.some(solution => solution.id === rule.solutionId));
        if (noAction !== -1) return `Veuillez choisir une action pour la règle ${noAction + 1}.`;
        if (!situation.solutions.some(solution => solution.id === situation.defaultSolutionId)) return 'Veuillez choisir l\'action « Sinon ».';
        const usedIds = new Set([...rules.map(rule => rule.solutionId), situation.defaultSolutionId]);
        if (situation.solutions.some(solution => usedIds.has(solution.id) && invalidSize(solution))) {
            return 'Veuillez indiquer une taille valide pour chaque bet ou raise utilisé.';
        }
        return undefined;
    }

    /**
     * Valide et prépare la sauvegarde de la situation (création ou édition).
     */
    saveSituation() {
        const error = this.validationError();
        if (error) {
            this.commonService.showSwalToast(error, 'error');
            return;
        }
        const nameTaken = 'Une situation existe déjà avec ce nom. Vous ne pouvez pas avoir deux situations avec le même nom.';
        if (this.mode === "new") {
            this.apiSituation.checkSituationNameFromUser(this.situation_obj.name!).subscribe((data: any) => {
                if (data.exist) this.commonService.showSwalToast(nameTaken, 'error');
                else this.addSituation();
            });
        } else if (this.mode === "edit") {
            if (this.situation_obj.name === this.editSituationName) {
                this.editSituation();
                return;
            }
            this.apiSituation.checkChangeSituationNameFromUser(this.situation_obj.id!, this.situation_obj.name!).subscribe((data: any) => {
                if (data.exist) this.commonService.showSwalToast(nameTaken, 'error');
                else this.editSituation();
            });
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
     * Une solution est conservée si elle est peinte dans le tableau, utilisée par une règle flop,
     * ou si elle compose une solution mixte peinte.
     * La situation éditée n'est pas modifiée : en cas d'échec, toutes les actions restent dans le pinceau.
     * Les champs propres à l'autre type de situation (actions précédentes ou flop) sont retirés.
     */
    situationToSave(): Situation {
        const usedSolutionIds = new Set<string | undefined>(this.isPostflop
            ? [...(this.situation_obj.rules ?? []).map(rule => rule.solutionId), this.situation_obj.defaultSolutionId]
            : this.situation_obj.situations.flat().map(cell => cell.solution));
        this.situation_obj.solutions
            .filter(solution => solution.type === 'mixed' && usedSolutionIds.has(solution.id))
            .forEach(solution => solution.colorList?.forEach(item => usedSolutionIds.add(item.color)));
        const situation: Situation = {
            ...this.situation_obj,
            solutions: this.situation_obj.solutions.filter(solution => usedSolutionIds.has(solution.id))
        };
        delete situation.flopType;
        if (this.isPostflop) {
            delete situation.previousPlayer1Action;
            delete situation.previousPlayer2Action;
            if (situation.heroSpot !== 'facingBet') delete situation.facingBetPercent;
            if (!this.hasTurn) delete situation.turnConditions;
            if (!this.hasRiver) delete situation.riverConditions;
            // Ligne d'action : seulement les streets qui précèdent la situation
            const streets = this.actionLineStreets.map(street => street.code);
            situation.actionLine = (situation.actionLine ?? [])
                .filter(step => streets.includes(step.street))
                .map(step => this.actionStepHasSize(step) ? step : { street: step.street, actor: step.actor, action: step.action });
        } else {
            for (const field of ['flopTypes', 'boardSuits', 'boardConditions', 'turnConditions', 'riverConditions', 'actionLine', 'heroSpot', 'facingBetPercent', 'pot', 'rules', 'defaultSolutionId'] as const) {
                delete situation[field];
            }
        }
        return situation;
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
        } else if (this.isPostflop) {
            mode = "3w";
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

        if (this.isPostflop) {
            // Postflop : la street, les types de flop et la mise adverse remplacent l'action précédente
            const types = this.flopTypes.filter(type => this.selectedFlopTypes.includes(type.code)).map(type => type.name).join(' / ');
            const facing = this.isFacingBet ? `vs ${this.situation_obj.facingBetPercent ?? 0}% ` : '';
            const street = this.hasTurn ? `${this.situationType?.name ?? ''} ` : '';
            action = `${street}${types ? types + ' ' : ''}${facing}`;
        } else if (!isFirstToAct) {
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
