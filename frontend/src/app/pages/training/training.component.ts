import { NgStyle } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputNumberModule } from 'primeng/inputnumber';
import { AppModalComponent } from '../../components/app-modal/app-modal.component';
import { CardComponent } from '../../components/card/card.component';
import { DefaultCardsComponent } from '../../components/default-cards/default-cards.component';
import { RangeGridComponent } from '../../components/range-grid/range-grid.component';
import { ActiveSituation, TableCard, TableColorCard, TableColorCardObj } from '../../interfaces/active-situation';
import { Card } from '../../interfaces/card';
import { IN_RANGE, Situation } from '../../interfaces/situation';
import { Solution, SolutionAction } from '../../interfaces/solution';
import { UserParams } from '../../interfaces/user-params';
import { OpponentLevelPipe } from '../../pipes/opponent-level.pipe';
import { PositionPipe } from '../../pipes/position.pipe';
import { SolutionColorPipe } from '../../pipes/solution-color.pipe';
import { TypePipe } from '../../pipes/type.pipe';
import { AuthService } from '../../services/auth.service';
import { FlopCard, FlopService, flopTypeName } from '../../services/flop.service';
import { describeCondition, describeHand, resolveAction } from '../../services/flop-rules';
import { cardRank, evaluateHand } from '../../services/hand-evaluator';
import { CommonService } from './../../services/common.service';

@Component({
    selector: 'app-training',
    standalone: true,
    imports: [NgStyle, FormsModule, InputNumberModule, SolutionColorPipe, DefaultCardsComponent, CardComponent, AppModalComponent, TypePipe, PositionPipe, OpponentLevelPipe, RangeGridComponent],
    templateUrl: './training.component.html',
    styleUrl: './training.component.scss'
})
export class TrainingComponent {
    private tableResizeObserver?: ResizeObserver;

    @ViewChild('tableStage') set tableStage(element: ElementRef<HTMLElement> | undefined) {
        this.tableResizeObserver?.disconnect();
        if (!element) return;
        const stage = element.nativeElement;
        this.tableResizeObserver = new ResizeObserver(([entry]) => {
            const scale = Math.min(1, entry.contentRect.width / 1000, entry.contentRect.height / 600);
            stage.style.setProperty('--table-scale', String(scale));
        });
        this.tableResizeObserver.observe(stage);
    }

    mode: string = "";
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
    initialTimer = { heure: 0, minute: 0, seconds: 0 };
    showTimer: boolean = false;
    hours: number = 0;
    minutes: number = 0;
    seconds: number = 0;
    private countdownInterval: any;
    colorList: any[] = [{ name: "heart", color: "red" }, { name: "diamond", color: "red" }, { name: "club", color: "black" }, { name: "spade", color: "black" }];
    fullCardStyle: boolean = false;
    nbSituationsChallenge: number = 0;
    readonly survivalMaxLives: number = 3;
    survivalLives: number = 3;
    survivalLifeSlots: number[] = [1, 2, 3];
    challengeFailed: boolean = false;
    challengeSuccess: boolean = false;
    showWrongAnswerModal: boolean = false;
    showEndSessionModal: boolean = false;
    showEndChallengeModal: boolean = false;
    showEndSurvivalModal: boolean = false;
    selectedAnswerLabel: string = '';
    currentHand: string = '';
    private showEndChallengeAfterSolution: boolean = false;
    private showEndSurvivalAfterSolution: boolean = false;
    raiseAmount: number = 2;
    betPercent: number = 50;
    readonly betPresets: number[] = [33, 50, 75, 100];
    raiseMultiplier: number = 3;
    readonly raiseMultiplierPresets: number[] = [2.5, 3, 4];
    readonly describeCondition = describeCondition;
    readonly describeHand = describeHand;
    playerInfoAnimationName: 'training-player-info-in-a' | 'training-player-info-in-b' = 'training-player-info-in-a';
    readonly confettiPieces = Array.from({ length: 28 }, (_, index) => ({
        x: (index * 37) % 100,
        delay: `-${(index % 8) * 0.18}s`,
        duration: `${2.4 + (index % 5) * 0.18}s`,
        drift: index % 2 === 0 ? 55 : -55
    }));

    tableColors = {
        "green": "#31866f",
        "red": "#a64a55",
        "blue": "#4778ad"
    }

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        protected commonService: CommonService,
        protected authService: AuthService,
        private flopService: FlopService,
    ) { }

    /**
     * Initialise le composant, charge les paramètres utilisateur et lance le mode de jeu.
     */
    ngOnInit(): void {
        if (this.activatedRoute.snapshot.params.hasOwnProperty('situationList') && this.activatedRoute.snapshot.params.hasOwnProperty('mode')) {

            const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
            const tableColor = this.tableColors[userParams.playmatColor];

            this.backgroundColor = tableColor ?
                `radial-gradient(ellipse at 50% 30%, ${tableColor}, #162825 145%)` :
                'radial-gradient(ellipse at 50% 30%, #31866f, #162825 145%)';

            if (userParams.cardStyle === 'contrast' || userParams.cardStyle === 'contrast-full') {
                this.colorList = [{ name: "heart", color: "#d20000" }, { name: "diamond", color: "#3B82F6" }, { name: "club", color: "#009700" }, { name: "spade", color: "black" }];
            }
            this.fullCardStyle = userParams.cardStyle === 'default-full' || userParams.cardStyle === 'contrast-full';

            this.situationList = JSON.parse(this.activatedRoute.snapshot.params['situationList']);
            this.mode = this.activatedRoute.snapshot.params['mode'];
            switch (this.mode) {
                case 'infinite':
                    this.generateSituation();
                    break;
                case 'challenge':
                    if (this.activatedRoute.snapshot.params.hasOwnProperty('challengeNbSituations')) {
                        this.nbSituationsChallenge = JSON.parse(this.activatedRoute.snapshot.params['challengeNbSituations']);
                        this.generateSituation();
                    }
                    break;
                case 'survival':
                    this.survivalLives = this.survivalMaxLives;
                    this.generateSituation();
                    break;
                case 'turbo':
                    if (this.activatedRoute.snapshot.params.hasOwnProperty('timer')) {
                        const timer = JSON.parse(this.activatedRoute.snapshot.params['timer']);
                        this.initialTimer = timer;
                        this.generateSituation();
                        this.showTimer = true;
                        this.startCountdown();
                    }
                    break;
                    break;
                default:
                    break;
            }
            const currentUrl = this.router.url;
            const baseUrl = currentUrl.split(';')[0];
            this.router.navigateByUrl(baseUrl);
        } else {
            this.router.navigate(['situations']);
        }
    }

    /**
     * Nettoie les ressources (timer) lors de la destruction du composant.
     */
    ngOnDestroy() {
        this.tableResizeObserver?.disconnect();
        this.clearCountdown();
    }

    /**
     * Filtre et inverse la liste des solutions par type.
     * @param solutionLst Liste des solutions à filtrer.
     * @param type Type de solution ('unique' ou 'color').
     * @returns Liste filtrée.
     */
    filteredSolutionLst(solutionLst: Solution[], type: string) {
        return solutionLst.filter(solution => solution.type === type).reverse();;
    }

    /**
     * Sélectionne une situation au hasard dans une liste.
     * @param situationLst Liste des situations disponibles.
     * @returns La situation choisie.
     */
    getRandomSituation(situationLst: Situation[]): Situation {
        const randomIndex = Math.floor(Math.random() * situationLst.length);
        return situationLst[randomIndex];
    }

    /**
     * Génère une nouvelle situation d'entraînement active.
     */
    generateSituation() {
        let situation = this.getRandomSituation(this.situationList);
        this.commonService.migrateSolutions(situation.solutions);
        this.currentSituation = situation;
        this.currentSituationName = this.currentSituation.name!;
        if (situation.type === 'flop' && situation.rules) {
            if (!this.generateFlopSituation(situation)) return;
        } else {
            this.generatePreflopSituation(situation);
        }
        this.raiseAmount = Math.min(this.maximumRaise(), Math.max(2, this.highestCurrentBet() * 2));
        this.betPercent = 50;
        this.raiseMultiplier = Math.min(3, this.maximumRaiseMultiplier());
        this.playerInfoAnimationName = this.playerInfoAnimationName === 'training-player-info-in-a'
            ? 'training-player-info-in-b'
            : 'training-player-info-in-a';
    }

    /**
     * Carte affichable à partir d'une carte du moteur de flop.
     */
    private toTableCard(card: FlopCard): TableColorCard {
        return { value: card.value, color: this.colorList.find(color => color.name === card.color) };
    }

    /**
     * Situation flop : main tirée dans la range, flop tiré selon les critères du board,
     * réponse attendue donnée par la première règle remplie (ou l'action « Sinon »).
     * @returns Faux si la situation est inutilisable (l'entraînement est alors quitté).
     */
    private generateFlopSituation(situation: Situation): boolean {
        const hands = situation.situations.flat().filter(cell => cell.solution === IN_RANGE).map(cell => cell.card);
        const hero = this.flopService.randomHeroHand(hands);
        const board = this.flopService.randomFlop({
            flopTypes: situation.flopTypes ?? [],
            boardSuits: situation.boardSuits,
            boardConditions: situation.boardConditions
        }, hero);
        if (!hero.length || !board.length) {
            // Situation importée sans range ou dont les critères de board n'admettent aucun flop
            this.commonService.showSwalToast(`La situation « ${situation.name} » est incomplète (range vide ou aucun flop possible).`, 'error');
            this.router.navigate(['situations']);
            return false;
        }
        const hand = evaluateHand(hero, board);
        const rules = situation.rules ?? [];
        const { solutionId, ruleIndex } = resolveAction(rules, situation.defaultSolutionId, hand);
        const [high, low] = [...hero].sort((a, b) => cardRank(b.value) - cardRank(a.value));
        const suffix = high.value === low.value ? '' : high.color === low.color ? 's' : 'o';
        this.currentHand = `${high.value}${low.value}${suffix}`;
        this.activeSituation = {
            type: 'flop',
            board: board.map(card => this.toTableCard(card)),
            pot: situation.pot,
            flopTypes: situation.flopTypes,
            heroSpot: situation.heroSpot,
            facingBetPercent: situation.facingBetPercent,
            hand,
            rule: ruleIndex === -1 ? undefined : rules[ruleIndex],
            nbPlayer: situation.nbPlayer!,
            position: situation.position,
            leftCard: this.toTableCard(hero[0]),
            rightCard: this.toTableCard(hero[1]),
            solutions: situation.solutions,
            result: solutionId ? [solutionId] : [],
            stack: situation.stack,
            opponentLevel: situation.opponentLevel,
            fishPosition: situation.fishPosition
        };
        return true;
    }

    /**
     * Situation préflop : main tirée dans la grille, réponse attendue donnée par sa case.
     */
    private generatePreflopSituation(situation: Situation) {
        let situationCase = this.getRandomCase(situation.situations);
        this.currentHand = situationCase.card;
        let cards = this.generateCards(situationCase);
        let result = this.getResultCase(situationCase.solution!);
        this.activeSituation = {
            type: 'preflop',
            nbPlayer: situation.nbPlayer!,
            position: situation.position,
            leftCard: cards.leftCard,
            rightCard: cards.rightCard,
            solutions: situation.solutions,
            result: result,
            stack: situation.stack,
            opponentLevel: situation.opponentLevel,
            fishPosition: situation.fishPosition,
            previousPlayer1Action: situation.previousPlayer1Action,
            previousPlayer2Action: situation.previousPlayer2Action
        }
    }

    submitPokerAction(action: SolutionAction) {
        const matchingSolutions = this.activeSituation.solutions.filter(item =>
            item.type === 'unique' && this.matchesSubmittedAction(item, action)
        );
        const solution = matchingSolutions.find(item => this.activeSituation.result.includes(item.id))
            ?? matchingSolutions[0];
        this.selectedAnswerLabel = solution?.display_name || this.submittedActionLabel(action);
        this.checkResultCase(solution?.id ?? `invalid_${action}`);
    }

    private matchesSubmittedAction(solution: Solution, action: SolutionAction): boolean {
        if (solution.action === action) {
            if (action === 'bet') return Math.abs((solution.betPercent ?? -1) - this.betPercent) < 0.5;
            if (action === 'raise' && this.isFacingBet) return Math.abs((solution.raiseMultiplier ?? -1) - this.raiseMultiplier) < 0.05;
            return action !== 'raise' || Math.abs((solution.raiseAmount ?? -1) - this.raiseAmount) < 0.001;
        }

        if (this.isFacingBet) {
            // Un raise de la taille du tapis équivaut à un all-in
            const raiseIsAllIn = (multiplier: number) => this.facingBetAmount() * multiplier >= this.maximumRaise() - 0.001;
            return (action === 'raise' && raiseIsAllIn(this.raiseMultiplier) && solution.action === 'all-in')
                || (action === 'all-in' && solution.action === 'raise' && raiseIsAllIn(solution.raiseMultiplier ?? 0));
        }

        if (this.isFlop) {
            // Un bet de la taille du tapis équivaut à un all-in
            const betIsAllIn = (percent: number) => this.betAmount(percent) >= this.maximumRaise() - 0.001;
            return (action === 'bet' && betIsAllIn(this.betPercent) && solution.action === 'all-in')
                || (action === 'all-in' && solution.action === 'bet' && betIsAllIn(solution.betPercent ?? 0));
        }

        const maximumRaise = this.maximumRaise();
        const submittedMaximumRaise = action === 'raise' && Math.abs(this.raiseAmount - maximumRaise) < 0.001;
        const solutionMaximumRaise = solution.action === 'raise'
            && Math.abs((solution.raiseAmount ?? -1) - maximumRaise) < 0.001;

        return (submittedMaximumRaise && solution.action === 'all-in')
            || (action === 'all-in' && solutionMaximumRaise);
    }

    get correctAnswerLabel(): string {
        return this.activeSituation.result
            .map(id => this.activeSituation.solutions.find(solution => solution.id === id))
            .filter((solution): solution is Solution => !!solution)
            .map(solution => solution.display_name || this.commonService.solutionActionLabel(solution))
            .join(' / ');
    }

    private submittedActionLabel(action: SolutionAction): string {
        const labels: Record<SolutionAction, string> = {
            'fold': 'Fold',
            'check': 'Check',
            'call': 'Call',
            'limp': 'Limp',
            'raise': this.isFacingBet ? `Raise x${this.raiseMultiplier}` : `Raise ${this.raiseAmount} BB`,
            'bet': `Bet ${this.betPercent}%`,
            'all-in': 'All-in'
        };
        return labels[action];
    }

    get isFlop(): boolean {
        return this.activeSituation?.type === 'flop';
    }

    get isFacingBet(): boolean {
        return this.isFlop && this.activeSituation.heroSpot === 'facingBet';
    }

    /**
     * Noms des types de flop de la situation en cours.
     */
    get flopTypesLabel(): string {
        return (this.activeSituation.flopTypes ?? []).map(type => flopTypeName(type)).join(', ');
    }

    /**
     * Mise adverse en BB, arrondie à 0,1 BB.
     */
    facingBetAmount(): number {
        return Math.round((this.activeSituation.pot ?? 0) * (this.activeSituation.facingBetPercent ?? 0) / 10) / 10;
    }

    /**
     * Multiple de la mise adverse au-delà duquel le raise couvre tout le tapis.
     */
    maximumRaiseMultiplier(): number {
        const bet = this.isFacingBet ? this.facingBetAmount() : 0;
        return bet > 0 ? Math.max(1.5, Math.ceil(this.maximumRaise() / bet * 10) / 10) : 10;
    }

    setRaiseMultiplier(multiplier: number) {
        this.raiseMultiplier = Math.min(this.maximumRaiseMultiplier(), Math.max(1.5, Math.round((multiplier || 1.5) * 10) / 10));
    }

    raiseMultiplierAmount(): number {
        return Math.min(this.maximumRaise(), Math.round(this.facingBetAmount() * this.raiseMultiplier * 10) / 10);
    }

    /**
     * Montant en BB d'un bet exprimé en pourcentage du pot, arrondi à 0,1 BB et limité au tapis.
     * @param percent Pourcentage du pot.
     */
    betAmount(percent: number = this.betPercent): number {
        const amount = Math.round((this.activeSituation.pot ?? 0) * percent / 10) / 10;
        return Math.min(this.maximumRaise(), amount);
    }

    /**
     * Pourcentage du pot au-delà duquel le bet couvre tout le tapis.
     */
    maximumBetPercent(): number {
        const pot = this.activeSituation.pot ?? 0;
        return pot > 0 ? Math.max(1, Math.ceil(this.maximumRaise() / pot * 100)) : 100;
    }

    setBetPercent(percent: number) {
        this.betPercent = Math.min(this.maximumBetPercent(), Math.max(1, Math.round(percent || 1)));
    }

    setRaisePreset(preset: 'x2' | 'x3' | 'pot') {
        const highestBet = this.highestCurrentBet();
        const amount = preset === 'x2' ? highestBet * 2 : preset === 'x3' ? highestBet * 3 : this.potRaiseAmount();
        this.raiseAmount = Math.min(this.maximumRaise(), Math.max(this.minimumRaise(), amount));
    }

    updateRaiseAmount(event: Event) {
        this.setRaiseAmount(Number((event.target as HTMLInputElement).value));
    }

    setRaiseAmount(amount: number) {
        this.raiseAmount = Math.min(this.maximumRaise(), Math.max(this.minimumRaise(), amount || this.minimumRaise()));
    }

    adjustRaiseAmount(delta: number) {
        this.setRaiseAmount(Math.round((this.raiseAmount + delta) * 2) / 2);
    }

    canCheck(): boolean {
        // Au flop, le héros peut checker sauf face à une mise
        if (this.isFlop) return !this.isFacingBet;
        return this.playerCurrentBet() >= this.highestCurrentBet();
    }

    canCall(): boolean {
        if (this.isFlop) return this.isFacingBet;
        if (this.canCheck()) return false;
        const facesAction = this.previousActions().some(action => action === 'Limp' || action === 'Call' || action?.startsWith('Raise') || action === 'All In');
        return facesAction || !this.hasSolutionAction('limp');
    }

    canLimp(): boolean {
        return !this.isFlop && this.playerCurrentBet() < 1
            && !this.previousActions().some(action => action && action !== 'Fold' && action !== 'Aucune')
            && this.hasSolutionAction('limp');
    }

    canRaise(): boolean {
        return !this.isFlop && this.maximumRaise() > this.highestCurrentBet();
    }

    private previousActions(): (string | undefined)[] {
        if (this.activeSituation.nbPlayer === 2) return [this.activeSituation.previousPlayer1Action];
        return [this.activeSituation.previousPlayer1Action, this.activeSituation.previousPlayer2Action];
    }

    private hasSolutionAction(action: SolutionAction): boolean {
        return this.activeSituation.solutions.some(solution => solution.type === 'unique' && solution.action === action);
    }

    private playerCurrentBet(): number {
        return this.activeSituation.position === 'bb' ? 1 : this.activeSituation.position === 'sb' ? 0.5 : 0;
    }

    private opponentBets(): number[] {
        if (this.activeSituation.nbPlayer === 2) {
            const position = this.getHUOpponentPosition(this.activeSituation.position!);
            return [this.getBetAmount(position, this.activeSituation.previousPlayer1Action, this.activeSituation.stack)];
        }
        return ['left', 'right'].map(slot => {
            const side = slot as 'left' | 'right';
            return this.getBetAmount(this.getOpponentPosition(side), this.getOpponentAction(side), this.activeSituation.stack);
        });
    }

    highestCurrentBet(): number {
        return Math.max(1, this.playerCurrentBet(), ...this.opponentBets());
    }

    maximumRaise(): number {
        return this.activeSituation.stack ?? 0;
    }

    minimumRaise(): number {
        return Math.min(this.maximumRaise(), this.highestCurrentBet() * 2);
    }

    potRaiseAmount(): number {
        const heroBet = this.playerCurrentBet();
        const highestBet = this.highestCurrentBet();
        const pot = heroBet + this.opponentBets().reduce((total, bet) => total + bet, 0);
        return Math.min(this.maximumRaise(), highestBet + pot + (highestBet - heroBet));
    }

    /**
     * Détermine la position relative du joueur "fish" sur la table.
     * @param mainPlayerPosition Position de l'utilisateur.
     * @param fishPlayerPosition Position réelle du poisson.
     * @returns Identifiant du slot (opponent1 ou opponent2).
     */
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

    /**
     * Sélectionne une main (Case) au hasard dans les combinaisons d'une situation.
     * @param array Tableau des combinaisons de cartes.
     * @returns La main choisie.
     */
    getRandomCase(array: Card[][]): Card {
        const outerArrayIndex = Math.floor(Math.random() * array.length);
        const innerArray = array[outerArrayIndex];
        const innerArrayIndex = Math.floor(Math.random() * innerArray.length);
        return innerArray[innerArrayIndex];
    }

    /**
     * Génère une liste de couleurs aléatoires et distinctes.
     * @param num Nombre de couleurs à générer.
     * @returns Liste d'objets couleur.
     */
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

    /**
     * Prépare les objets cartes (valeur et couleur) pour l'affichage.
     * @param situationCase La main à générer.
     * @returns Objet contenant les deux cartes.
     */
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

    /**
     * Récupère la liste des identifiants ou couleurs valides pour une main.
     * @param good_solution Identifiant de la solution attendue.
     * @returns Liste des valeurs/couleurs gagnantes.
     */
    getResultCase(good_solution: string): string[] {
        let solution = this.currentSituation.solutions.filter(solution => solution.id === good_solution)[0];
        if (solution.type === "unique") {
            return [solution.id];
        } else {
            return solution.colorList!.map(color => color.color);
        }
    }

    /**
     * Retourne le chemin de l'image du jeton selon l'action et le montant de la mise.
     * @param action Nom de l'action (Raise, Call, etc.).
     * @param bet Montant de la mise en BB.
     * @returns Chemin de l'asset image.
     */
    getChipImage(action?: string, bet?: number): string {
        if (!action || action === 'Fold') {
            return '';
        }
        
        if (action === 'All In') {
            return 'assets/img/chip-allin.png';
        }

        if (bet === 0.5) {
            return 'assets/img/chip-1.png';
        }
        
        if (bet === 1) {
            return 'assets/img/chip-small.png';
        }

        return 'assets/img/chip-medium.png';
    }

    /**
     * Retourne la classe CSS de taille pour l'image du jeton selon l'action et le montant.
     * @param action Nom de l'action.
     * @param bet Montant de la mise.
     * @returns Classes Tailwind (ex: h-10, h-14, h-20, h-8).
     */
    getChipClass(action?: string, bet?: number): string {
        if (!action || action === 'Check' || action === 'Fold') {
            return 'h-10';
        }

        if (action === 'All In') {
            return 'h-20';
        }

        if (bet === 0.5) {
            return 'h-8';
        }

        if (bet === 1) {
            return 'h-10';
        }

        return 'h-14';
    }

    /**
     * Calcule le montant numérique misé en BB.
     * @param position Position du joueur (bb, sb, bu).
     * @param action Action effectuée.
     * @param stack Stack actuel pour le All-in.
     * @returns Montant en BB.
     */
    getBetAmount(position: string, action: string | undefined, stack: number | undefined): number {
        // Au flop, les mises préflop sont dans le pot : personne n'a encore misé
        if (this.isFlop) return 0;
        const stackVal = stack ?? 0;
        const blindValues: Record<string, number> = { 'bb': 1, 'sb': 0.5, 'bu': 0 };

        if (!action || action === 'Aucune' || action === 'Check' || action === 'Fold') {
            return blindValues[position] ?? 0;
        }

        switch (action) {
            case 'Limp': return 1;
            case 'Call': return 1;
            case 'Raise 2BB': return 2;
            case 'Raise 2.5BB': return 2.5;
            case 'All In': return stackVal;
            default: return blindValues[position] ?? 0;
        }
    }

    /**
     * Retourne le montant misé formaté en texte (ex: "1 BB").
     * @param position Position du joueur.
     * @param action Action effectuée.
     * @param stack Stack actuel.
     * @returns Chaîne de caractères formatée.
     */
    getBetAmountStr(position: string, action: string | undefined, stack: number | undefined): string {
        const bet = this.getBetAmount(position, action, stack);
        return bet > 0 ? `${bet} BB` : '';
    }

    /**
     * Retourne l'image de jeton appropriée pour une mise ou une blinde.
     * @param action Action effectuée.
     * @param position Position pour les blindes automatiques.
     * @returns Chemin de l'image.
     */
    getChipImageForBet(action: string | undefined, position: string): string {
        if (this.isFlop) return '';
        const bet = this.getBetAmount(position, action, this.activeSituation.stack);
        if (!action || action === 'Aucune' || action === 'Check') {
            // Afficher les jetons de blind pour BB et SB
            if (position === 'bb' || position === 'sb') {
                return this.getChipImage('Blind', bet);
            }
            return '';
        }
        if (action === 'Fold') {
            // Blind déjà posé avant le fold
            if (position === 'bb' || position === 'sb') {
                return this.getChipImage('Blind', bet);
            }
            return '';
        }
        return this.getChipImage(action, bet);
    }

    /**
     * Calcule le stack restant après déduction de la mise actuelle.
     * @param position Position du joueur.
     * @param action Action effectuée.
     * @param stack Stack de départ.
     * @returns Stack restant calculé.
     */
    getOpponentRemainingStack(position: string, action: string | undefined, stack: number | undefined): number {
        const totalStack = stack ?? 0;
        if (action === 'All In') return 0;
        const bet = this.getBetAmount(position, action, totalStack);
        return totalStack - bet;
    }

    /**
     * Identifie la position de l'adversaire en duel (Heads-up).
     * @param userPosition Position du joueur utilisateur.
     * @returns Position de l'adversaire (bb ou sb).
     */
    getHUOpponentPosition(userPosition: string): string {
        return userPosition === 'sb' ? 'bb' : 'sb';
    }

    /**
     * Récupère l'action de l'adversaire selon son emplacement (3-way).
     * @param slot Côté de la table ('left' ou 'right').
     * @returns Nom de l'action ou undefined.
     */
    getOpponentAction(slot: 'left' | 'right'): string | undefined {
        if (this.activeSituation.nbPlayer !== 3 || this.isFlop) return undefined;

        switch (this.activeSituation.position) {
            case 'bb':
                // User = BB (3rd acting). Slot Left = BU (1st), Slot Right = SB (2nd).
                return slot === 'left' ? this.activeSituation.previousPlayer1Action : this.activeSituation.previousPlayer2Action;
            case 'sb':
                // User = SB (2nd acting). Slot Right = BU (1st), Slot Left = BB (3rd - no action yet).
                return slot === 'right' ? this.activeSituation.previousPlayer1Action : undefined;
            case 'bu':
                // User = BU (1st acting). Nobody acted before.
                return undefined;
            default:
                return undefined;
        }
    }

    /**
     * Récupère la position (BU, SB, BB) de l'adversaire selon son emplacement.
     * @param slot Côté de la table.
     * @returns Code de position.
     */
    getOpponentPosition(slot: 'left' | 'right'): string {
        if (this.activeSituation.nbPlayer !== 3) return '';

        switch (this.activeSituation.position) {
            case 'bb':
                return slot === 'left' ? 'bu' : 'sb';
            case 'sb':
                return slot === 'left' ? 'bb' : 'bu';
            case 'bu':
                return slot === 'left' ? 'sb' : 'bb';
            default:
                return '';
        }
    }

    /**
     * Vérifie la réponse de l'utilisateur et met à jour les scores.
     * @param result La réponse choisie par l'utilisateur.
     */
    checkResultCase(result: string) {
        if (this.countResult) this.totalResponse += 1;
        if (this.activeSituation.result.includes(result)) {
            if (this.countResult) {
                this.goodResponse += 1;
                this.successRatePercentage = Math.round((this.goodResponse / this.totalResponse) * 100);
            }
            this.countResult = true;
            this.commonService.showSwalToast(`Bonne réponse !`);
            switch (this.mode) {
                case 'challenge':
                    if (this.totalResponse >= this.nbSituationsChallenge) {
                        this.challengeSuccess = true;
                        this.commonService.showSwalToast(`Défi réussi !`, 'success');
                        this.showEndChallengeModal = true;
                    } else {
                        this.generateSituation();
                    }
                    break;
                default:
                    this.generateSituation();
                    break;
            }
        } else {
            if (this.countResult) {
                this.badResponse += 1;
                this.successRatePercentage = Math.round((this.goodResponse / this.totalResponse) * 100);
            }
            const shouldDisplaySolution = this.shouldDisplaySolutionOnError();
            switch (this.mode) {
                case 'infinite':
                    if (shouldDisplaySolution) {
                        this.openWrongAnswerModal();
                    } else {
                        this.commonService.showSwalToast(`Mauvaise réponse !`, 'error');
                        if (this.shouldGoToNextSituationOnError()) {
                            this.generateSituation();
                        } else {
                            this.countResult = false;
                        }
                    }
                    break;
                case 'turbo':
                    this.openWrongAnswerModal();
                    break;
                case 'challenge':
                    this.challengeFailed = true;
                    if (shouldDisplaySolution) {
                        this.showEndChallengeAfterSolution = true;
                        this.openWrongAnswerModal();
                    } else {
                        this.commonService.showSwalToast(`Mauvaise réponse ! Défi perdu.`, 'error');
                        this.showEndChallengeModal = true;
                    }
                    break;
                case 'survival':
                    this.survivalLives = Math.max(0, this.survivalMaxLives - this.badResponse);
                    if (this.survivalLives === 0) {
                        if (shouldDisplaySolution) {
                            this.showEndSurvivalAfterSolution = true;
                            this.openWrongAnswerModal();
                        } else {
                            this.commonService.showSwalToast(`Mauvaise réponse ! Survie terminée.`, 'error');
                            this.showEndSurvivalModal = true;
                        }
                    } else if (shouldDisplaySolution) {
                        this.openWrongAnswerModal();
                    } else {
                        this.commonService.showSwalToast(`Mauvaise réponse !`, 'error');
                        this.generateSituation();
                    }
                    break;
                default:
                    break;
            }
        }
    }

    private shouldDisplaySolutionOnError(): boolean {
        const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
        return userParams.displaySolution;
    }

    private shouldGoToNextSituationOnError(): boolean {
        const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
        return userParams.nextSituationOnError ?? false;
    }

    private openWrongAnswerModal() {
        if (this.mode === 'turbo') {
            this.clearCountdown();
        }
        this.showWrongAnswerModal = true;
    }

    /**
     * Ferme la modale de mauvaise réponse et passe à la situation suivante.
     */
    closeSolutionModal() {
        this.showWrongAnswerModal = false;
        if (this.showEndChallengeAfterSolution) {
            this.showEndChallengeAfterSolution = false;
            this.showEndChallengeModal = true;
            return;
        }
        if (this.showEndSurvivalAfterSolution) {
            this.showEndSurvivalAfterSolution = false;
            this.showEndSurvivalModal = true;
            return;
        }
        this.generateSituation();
        if (this.mode === 'turbo') {
            this.startCountdown(false);
        }
    }

    /**
     * Génère un nombre entier aléatoire entre 0 et 100.
     * @returns Nombre aléatoire.
     */
    generateRandomNumber(): number {
        return Math.floor(Math.random() * 101);
    }

    /**
     * Réinitialise les statistiques de la session et relance l'entraînement.
     */
    resetSession() {
        if (this.mode === 'turbo') {
            this.showEndSessionModal = false;
        } else if (this.mode === 'challenge') {
            this.showEndChallengeModal = false;
        } else if (this.mode === 'survival') {
            this.showEndSurvivalModal = false;
        }
        this.goodResponse = 0;
        this.badResponse = 0;
        this.totalResponse = 0;
        this.successRatePercentage = 0;
        this.countResult = true;
        this.challengeFailed = false;
        this.challengeSuccess = false;
        this.survivalLives = this.survivalMaxLives;
        this.showEndChallengeAfterSolution = false;
        this.showEndSurvivalAfterSolution = false;
        if (this.mode === 'turbo') {
            this.startCountdown();
        }
        this.generateSituation();
    }

    /**
     * Démarre le minuteur pour le mode Turbo.
     */
    startCountdown(resetTimer: boolean = true) {
        this.clearCountdown();
        if (resetTimer) {
            this.hours = this.initialTimer.heure;
            this.minutes = this.initialTimer.minute;
            this.seconds = this.initialTimer.seconds;
        }
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
                this.showEndSessionModal = true;
            }
        }, 1000);
    }

    /**
     * Arrête le minuteur actif.
     */
    clearCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = undefined;
        }
    }

}
