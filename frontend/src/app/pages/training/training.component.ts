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
import { AuthService } from '../../services/auth.service';
import { CommonService } from './../../services/common.service';

@Component({
    selector: 'app-training',
    standalone: true,
    imports: [NgStyle, SolutionColorPipe, DefaultCardsComponent, CardComponent],
    templateUrl: './training.component.html'
})
export class TrainingComponent {

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

    tableColors = {
        "green": "rgb(0, 151, 0)",
        "red": "rgb(255, 0, 0)",
        "blue": "#3B82F6"
    }

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        protected commonService: CommonService,
        protected authService: AuthService,
    ) { }

    /**
     * Initialise le composant, charge les paramètres utilisateur et lance le mode de jeu.
     */
    ngOnInit(): void {
        if (this.activatedRoute.snapshot.params.hasOwnProperty('situationList') && this.activatedRoute.snapshot.params.hasOwnProperty('mode')) {

            const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
            const tableColor = this.tableColors[userParams.playmatColor];

            this.backgroundColor = tableColor ?
                `radial-gradient(${tableColor}, black 150%)` :
                'radial-gradient(rgb(0, 151, 0), black 150%)';

            if (userParams.cardStyle === 'contrast') {
                this.colorList = [{ name: "heart", color: "#d20000" }, { name: "diamond", color: "#3B82F6" }, { name: "club", color: "#009700" }, { name: "spade", color: "black" }];
            }

            this.situationList = JSON.parse(this.activatedRoute.snapshot.params['situationList']);
            this.mode = this.activatedRoute.snapshot.params['mode'];
            switch (this.mode) {
                case 'infinite':
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
                case 'challenge':
                    break;
                default:
                    break;
            }
            const currentUrl = this.router.url;
            const baseUrl = currentUrl.split(';')[0];
            this.router.navigateByUrl(baseUrl);
        } else {
            this.router.navigate(['situations-list-training']);
        }
    }

    /**
     * Nettoie les ressources (timer) lors de la destruction du composant.
     */
    ngOnDestroy() {
        this.clearCountdown();
    }

    /**
     * Ajuste le zoom de la table après l'initialisation de la vue selon la hauteur de l'écran.
     */
    ngAfterViewInit() {
        if (window.innerHeight >= 1080) {
            document.getElementById("poker-table-div")?.classList.add("scale-125");
        } else if (window.innerHeight <= 750) {
            document.getElementById("poker-table-div")?.classList.add("scale-90");
        }
    }

    /**
     * Gère le redimensionnement de la fenêtre pour ajuster le zoom de la table.
     * @param event L'événement de redimensionnement.
     */
    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        const div = document.getElementById("poker-table-div")!;
        if (event.target.innerHeight > 1080) {
            div.classList.add("scale-125");
        } else {
            div.classList.remove("scale-125");
        }
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
            fishPosition: situation.fishPosition,
            previousPlayer1Action: situation.previousPlayer1Action,
            previousPlayer2Action: situation.previousPlayer2Action
        }
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
     * Retourne le chemin de l'image du jeton selon l'action.
     * @param action Nom de l'action (Raise, Call, etc.).
     * @returns Chemin de l'asset image.
     */
    getChipImage(action?: string): string {
        if (!action || action === 'Fold' || action === 'Check' || action === 'Aucune') {
            return '';
        }
        
        if (action === 'All In') {
            return 'assets/images/chip-allin.png';
        }
        
        if (action === 'Limp' || action === 'Call' || action === 'Raise 2BB' || action === 'Raise 2.5BB' || action === 'Raise 3BB') {
            return 'assets/images/chip-small.png';
        }

        return 'assets/images/chip-medium.png';
    }

    /**
     * Retourne la classe CSS de taille pour l'image du jeton selon l'action.
     * @param action Nom de l'action.
     * @returns Classes Tailwind (ex: h-10, h-14, h-20).
     */
    getChipClass(action?: string): string {
        if (!action || action === 'Fold' || action === 'Check' || action === 'Aucune') {
            return 'h-10';
        }

        if (action === 'All In') {
            return 'h-20';
        }

        if (action === 'Limp' || action === 'Call' || action === 'Raise 2BB' || action === 'Raise 2.5BB' || action === 'Raise 3BB') {
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
            case 'Raise 3BB': return 3;
            case 'Raise 4BB': return 4;
            case 'Raise 5BB': return 5;
            case 'Raise 10BB': return 10;
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
        if (!action || action === 'Aucune' || action === 'Check') {
            // Afficher les jetons de blind pour BB et SB
            return (position === 'bb' || position === 'sb') ? 'assets/images/chip-small.png' : '';
        }
        if (action === 'Fold') {
            // Blind déjà posé avant le fold
            return (position === 'bb' || position === 'sb') ? 'assets/images/chip-small.png' : '';
        }
        return this.getChipImage(action);
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
        if (this.activeSituation.nbPlayer !== 3) return undefined;

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
            this.generateSituation();
        } else {
            if (this.countResult) {
                this.badResponse += 1;
                this.successRatePercentage = Math.round((this.goodResponse / this.totalResponse) * 100);
            }
            switch (this.mode) {
                case 'infinite':
                    const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
                    if (userParams.displaySolution) {
                        this.commonService.showModal('wrong-answer-modal');
                    } else {
                        this.commonService.showSwalToast(`Mauvaise réponse !`, 'error');
                        this.countResult = false;
                    }
                    break;
                case 'turbo':
                    this.commonService.showSwalToast(`Mauvaise réponse !`, 'error');
                    this.generateSituation();
                    break;
                case 'challenge':
                    break;
                default:
                    break;
            }
        }
    }

    /**
     * Ferme la modale de mauvaise réponse et passe à la situation suivante.
     */
    closeSolutionModal() {
        this.commonService.closeModal('wrong-answer-modal');
        this.generateSituation();
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
        this.commonService.closeModal('end-session-modal');
        this.goodResponse = 0;
        this.badResponse = 0;
        this.totalResponse = 0;
        this.successRatePercentage = 0;
        this.countResult = true;
        this.startCountdown();
        this.generateSituation();
    }

    /**
     * Démarre le minuteur pour le mode Turbo.
     */
    startCountdown() {
        this.hours = this.initialTimer.heure;
        this.minutes = this.initialTimer.minute;
        this.seconds = this.initialTimer.seconds;
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
                this.commonService.showModal('end-session-modal');
            }
        }, 1000);
    }

    /**
     * Arrête le minuteur actif.
     */
    clearCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }

}
