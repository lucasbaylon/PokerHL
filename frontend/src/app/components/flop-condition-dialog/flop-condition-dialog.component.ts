import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { cloneDeep } from 'lodash';
import { AppModalComponent } from '../app-modal/app-modal.component';
import { BOARD_PAIRING_LABELS, Comparator, RANK_OPTIONS, RUNOUT_ATTRS, RankConstraint, RuleCondition, RunoutFrom, describeCondition } from '../../services/flop-rules';
import { Street } from '../../services/flop.service';
import { BoardPairing, MADE_HAND_LEVELS, MadeHandLevel } from '../../services/hand-evaluator';

type Option<T> = { name: string, code: T };

/** Brouillon éditable d'une condition : tous les champs possibles, nettoyés à l'enregistrement. */
interface ConditionDraft {
    kind: RuleCondition['kind'];
    negate: boolean;
    op: Comparator;
    level: MadeHandLevel;
    kickerMode: RankConstraint['mode'] | 'none';
    kickerN: number;
    flushMode: RankConstraint['mode'] | 'none';
    flushN: number;
    straight: 'any' | 'bottom' | 'notBottom';
    rank: number;
    n: number;
    draw: string;
    fdMode: RankConstraint['mode'] | 'none';
    fdN: number;
    highCard: boolean;
    twoCards: boolean;
    overThird: boolean;
    throughTop: boolean;
    card: 'high' | 'low' | 'any';
    ref: string;
    attr: string;
    suits: string;
    strengthMode: RankConstraint['mode'] | 'none';
    strengthN: number;
    pairing: BoardPairing;
    from: RunoutFrom;
}

const DEFAULT_DRAFT: ConditionDraft = {
    kind: 'made', negate: false, op: '>=', level: 'top_pair',
    kickerMode: 'none', kickerN: 4, flushMode: 'none', flushN: 4, straight: 'any',
    rank: 10, n: 2, draw: 'fd', fdMode: 'none', fdN: 4,
    highCard: false, twoCards: false, overThird: false, throughTop: false,
    card: 'high', ref: 'top', attr: 'topRank', suits: 'twoTone',
    strengthMode: 'none', strengthN: 1, pairing: 'paired', from: 'previous'
};

/** Niveaux de main qui n'existent qu'à partir d'une street (4e carte au turn, 5e carte à la river). */
const LEVELS_FROM_STREET: Partial<Record<MadeHandLevel, Street>> = {
    pp_below_third: 'turn', fourth_pair: 'turn', pp_below_fourth: 'river', fifth_pair: 'river'
};

const STREET_ORDER: Street[] = ['flop', 'turn', 'river'];

@Component({
    selector: 'app-flop-condition-dialog',
    standalone: true,
    imports: [FormsModule, DropdownModule, InputNumberModule, CheckboxModule, AppModalComponent],
    templateUrl: './flop-condition-dialog.component.html'
})
export class FlopConditionDialogComponent implements OnChanges {
    @Input() open = false;
    /** Condition à modifier, ou rien pour en créer une. */
    @Input() condition?: RuleCondition;
    /** Limite le choix aux conditions de board (filtre des boards d'une situation). */
    @Input() boardOnly = false;
    /** Street sur laquelle la condition est évaluée : limite les critères proposés (dernière carte, tirages, niveaux de main). */
    @Input() street: Street = 'flop';
    @Output() saved = new EventEmitter<RuleCondition>();
    @Output() closed = new EventEmitter<void>();

    draft: ConditionDraft = { ...DEFAULT_DRAFT };

    readonly kinds: (Option<RuleCondition['kind']> & { group: string })[] = [
        { code: 'made', name: 'Main faite', group: 'Main' },
        { code: 'pocketPair', name: 'Rang de la paire servie', group: 'Main' },
        { code: 'underpair', name: 'Paire servie sous la top card (position)', group: 'Main' },
        { code: 'kicker', name: 'Kicker / carte basse', group: 'Main' },
        { code: 'heroCard', name: 'Carte haute ou basse du héros', group: 'Main' },
        { code: 'th', name: 'Carte haute parmi les cartes absentes du board', group: 'Main' },
        { code: 'broadway', name: 'Broadway (deux cartes ≥ T)', group: 'Main' },
        { code: 'suited', name: 'Main assortie', group: 'Main' },
        { code: 'kickerPlays', name: 'Kicker qui joue (bat la même paire avec un kicker plus faible)', group: 'Main' },
        { code: 'draw', name: 'Tirage', group: 'Tirages' },
        { code: 'backdoor', name: 'Backdoor', group: 'Tirages' },
        { code: 'board', name: 'Board', group: 'Board' }
    ];

    readonly comparators: Option<Comparator>[] = [
        { code: '>=', name: '≥' }, { code: '>', name: '>' }, { code: '=', name: '=' }, { code: '<', name: '<' }, { code: '<=', name: '≤' }
    ];
    readonly madeComparators: Option<Comparator>[] = [
        { code: '>=', name: 'Au moins' }, { code: '=', name: 'Exactement' }, { code: '<=', name: 'Au plus' }
    ];
    readonly allLevels = MADE_HAND_LEVELS.map(level => ({ code: level.code, name: level.name }));
    readonly rankModes: Option<ConditionDraft['kickerMode']>[] = [
        { code: 'none', name: 'Indifférent' },
        { code: 'top', name: 'Parmi les N meilleurs' },
        { code: 'notTop', name: 'Hors des N meilleurs' },
        { code: 'bottom', name: 'Parmi les N plus bas' },
        { code: 'notBottom', name: 'Sans les N plus bas' }
    ];
    readonly straightOptions: Option<ConditionDraft['straight']>[] = [
        { code: 'any', name: 'Toutes' }, { code: 'bottom', name: 'La plus basse possible' }, { code: 'notBottom', name: 'Pas la plus basse' }
    ];
    readonly ranks = RANK_OPTIONS.map(item => ({ code: item.rank, name: item.name }));
    readonly draws: Option<string>[] = [
        { code: 'fd', name: 'Tirage couleur (FD)' }, { code: 'oesd', name: 'OESD' }, { code: 'gutshot', name: 'Gutshot' },
        { code: 'straightDraw', name: 'Tirage quinte (OESD ou gutshot)' }, { code: 'combo', name: 'Combodraw (FD + tirage quinte)' },
        { code: 'any', name: 'N\'importe quel tirage' }
    ];
    readonly backdoors: Option<string>[] = [
        { code: 'bdfd', name: 'Backdoor couleur (BDFD)' }, { code: 'bdsd', name: 'Backdoor tirage quinte (BDSD)' }, { code: 'bdoesd', name: 'Backdoor OESD (BDOESD)' }
    ];
    readonly cards: Option<'high' | 'low' | 'any'>[] = [
        { code: 'high', name: 'Carte haute' }, { code: 'low', name: 'Carte basse' }, { code: 'any', name: 'L\'une des deux cartes' }
    ];
    readonly refs: Option<string>[] = [
        { code: 'top', name: 'Top card du board' }, { code: 'second', name: '2e carte du board' }, { code: 'third', name: '3e carte du board' },
        { code: 'bottom', name: 'Plus petite carte du board' }, { code: 'pair', name: 'Paire du board' },
        { code: 'topPair', name: 'Carte de la top pair (non pairée)' }, { code: 'secondPair', name: 'Carte de la 2e paire (non pairée)' }, { code: 'rank', name: 'Rang précis' }
    ];
    readonly boardAttrs: Option<string>[] = [
        { code: 'topRank', name: 'Top card' }, { code: 'bottomRank', name: 'Plus petite carte' }, { code: 'pairRank', name: 'Rang de la paire' },
        { code: 'unpairedRank', name: 'Carte non pairée (board pairé)' },
        { code: 'suits', name: 'Couleurs' }, { code: 'paired', name: 'Pairé' }, { code: 'straightPossible', name: 'Quinte possible' },
        { code: 'connected', name: 'Connecté (2 cartes à 4 rangs ou moins)' }, { code: 'containsRank', name: 'Contient un rang' }, { code: 'broadwayCount', name: 'Nombre de cartes ≥ T' },
        { code: 'pairing', name: 'Paires du board (non pairé, pairé, double pairé, brelan…)' },
        { code: 'suitCount', name: 'Nombre de cartes de la même couleur' },
        { code: 'straightCount', name: 'Nombre de cartes à la quinte' },
        { code: 'fourInRow', name: '4 cartes qui se suivent' },
        { code: 'newCardRank', name: 'Dernière carte : rang' },
        { code: 'newCardVs', name: 'Dernière carte : par rapport au board précédent' },
        { code: 'newCardPairs', name: 'Dernière carte : paire le board précédent' },
        { code: 'newCardSuits', name: 'Nouvelle(s) carte(s) : couleur possible, 4-flush…' },
        { code: 'newCardStraight', name: 'Nouvelle(s) carte(s) : quinte possible, 4-straight…' },
        { code: 'newCardTh', name: 'Nouvelle(s) carte(s) : parmi les meilleures absentes (TH)' },
        { code: 'pairGap', name: 'Écart entre la top pair et la 2e paire' },
        { code: 'fromFlop', name: 'Carte du board déjà présente au flop' },
        { code: 'flopFlushDraw', name: 'Tirage couleur du flop arrivé (turn ou river)' }
    ];
    readonly pairingOptions: Option<BoardPairing>[] = (Object.keys(BOARD_PAIRING_LABELS) as BoardPairing[])
        .map(code => ({ code, name: BOARD_PAIRING_LABELS[code] }));
    readonly previousRefs: Option<string>[] = [
        { code: 'top', name: 'Top card' }, { code: 'second', name: '2e carte' }, { code: 'third', name: '3e carte' }, { code: 'bottom', name: 'Plus petite carte' }
    ];
    readonly pairsRefs: Option<string>[] = [{ code: 'any', name: 'N\'importe quelle carte' }, ...this.previousRefs];
    readonly fromOptions: Option<RunoutFrom>[] = [
        { code: 'previous', name: 'Dernière carte (board précédent)' }, { code: 'flop', name: 'Turn et river (depuis le flop)' }
    ];
    readonly suitOptions: Option<string>[] = [{ code: 'rainbow', name: 'Arc-en-ciel' }, { code: 'twoTone', name: 'Two-tone' }, { code: 'mono', name: 'Monotone' }];

    /** Types de condition proposés (recalculés quand la street change). */
    availableKinds = this.kinds;
    /** Niveaux de main possibles sur la street (4e et 5e paires à partir du turn et de la river). */
    levels = this.allLevels;
    /** Critères de board de la street : la dernière carte n'existe qu'au turn et à la river, les couleurs du flop qu'au flop. */
    availableBoardAttrs: Option<string>[] = this.boardAttrs;

    /**
     * Options dépendant de la street et du mode board seul, recalculées une fois par changement d'entrée
     * (les listes gardent la même référence entre deux détections de changements).
     */
    private updateStreetOptions() {
        // Backdoors : flop uniquement ; tirages : plus aucun à la river
        this.availableKinds = this.boardOnly
            ? this.kinds.filter(kind => kind.code === 'board')
            : this.kinds.filter(kind => !(kind.code === 'backdoor' && this.street !== 'flop') && !(kind.code === 'draw' && this.street === 'river'));
        const streetIndex = STREET_ORDER.indexOf(this.street);
        this.levels = this.allLevels.filter(level => {
            const from = LEVELS_FROM_STREET[level.code];
            return !from || STREET_ORDER.indexOf(from) <= streetIndex;
        });
        this.availableBoardAttrs = this.boardAttrs.filter(attr => this.street === 'flop'
            ? !RUNOUT_ATTRS.includes(attr.code as never)
            : attr.code !== 'suits');
    }

    get hasKicker(): boolean {
        return ['top_pair', 'second_pair', 'third_pair', 'fourth_pair', 'fifth_pair', 'trips'].includes(this.draft.level);
    }

    /** Main dont on peut exiger le rang parmi les mains de même catégorie possibles sur le board. */
    get hasStrength(): boolean {
        return ['straight', 'full_house', 'quads', 'straight_flush'].includes(this.draft.level);
    }

    /** À la river, les critères sur les nouvelles cartes peuvent compter depuis le flop (turn et river). */
    get hasFrom(): boolean {
        return this.street === 'river' && ['newCardSuits', 'newCardStraight', 'newCardTh'].includes(this.draft.attr);
    }

    /** Aperçu lisible de la condition en cours d'édition. */
    get preview(): string {
        return describeCondition(this.build());
    }

    ngOnChanges(): void {
        this.updateStreetOptions();
        if (!this.open) return;
        this.draft = { ...DEFAULT_DRAFT, kind: this.boardOnly ? 'board' : DEFAULT_DRAFT.kind };
        if (this.condition) this.load(cloneDeep(this.condition));
    }

    /**
     * Remplit le brouillon avec une condition existante.
     */
    private load(condition: RuleCondition) {
        const draft: ConditionDraft = { ...this.draft, kind: condition.kind, negate: !!condition.negate };
        const fromConstraint = (constraint?: RankConstraint): [ConditionDraft['kickerMode'], number] =>
            constraint ? [constraint.mode, constraint.n] : ['none', 4];
        switch (condition.kind) {
            case 'made':
                draft.op = condition.op;
                draft.level = condition.level;
                [draft.kickerMode, draft.kickerN] = fromConstraint(condition.kicker);
                [draft.flushMode, draft.flushN] = fromConstraint(condition.flushRank);
                draft.straight = condition.straight ?? 'any';
                [draft.strengthMode, draft.strengthN] = fromConstraint(condition.strength);
                break;
            case 'pocketPair': draft.op = condition.op; draft.rank = condition.rank; break;
            case 'kicker':
            case 'underpair': [draft.kickerMode, draft.kickerN] = fromConstraint(condition.constraint); break;
            case 'heroCard': draft.card = condition.card; draft.op = condition.op; draft.ref = condition.ref; draft.rank = condition.rank ?? 10; break;
            case 'th': draft.op = condition.op; draft.n = condition.n; break;
            case 'draw':
                draft.draw = condition.draw;
                [draft.fdMode, draft.fdN] = fromConstraint(condition.fdRank);
                draft.twoCards = !!condition.twoCards;
                draft.overThird = !!condition.overThird;
                break;
            case 'backdoor':
                draft.draw = condition.draw;
                draft.highCard = !!condition.highCard;
                draft.twoCards = !!condition.twoCards;
                draft.throughTop = !!condition.throughTop;
                break;
            case 'board':
                draft.attr = condition.attr;
                if ('op' in condition) draft.op = condition.op;
                if ('rank' in condition) draft.rank = condition.rank;
                if ('n' in condition) draft.n = condition.n;
                if ('suits' in condition) draft.suits = condition.suits;
                if ('pairing' in condition) draft.pairing = condition.pairing;
                if ('ref' in condition) draft.ref = condition.ref;
                if ('from' in condition) draft.from = condition.from ?? 'previous';
                break;
        }
        this.draft = draft;
    }

    /**
     * Réinitialise les champs propres au type quand le type de condition change.
     */
    onChangeKind() {
        this.draft = { ...DEFAULT_DRAFT, kind: this.draft.kind, negate: this.draft.negate };
        if (this.draft.kind === 'draw') this.draft.draw = 'fd';
        if (this.draft.kind === 'backdoor') this.draft.draw = 'bdfd';
        if (this.draft.kind === 'th') { this.draft.op = '<='; this.draft.n = 2; }
        if (this.draft.kind === 'heroCard') this.draft.op = '>';
    }

    /**
     * Valeurs par défaut adaptées quand le critère de board change.
     */
    onChangeAttr() {
        const d = this.draft;
        d.from = 'previous';
        switch (d.attr) {
            case 'suitCount':
            case 'straightCount': d.op = '>='; d.n = 3; break;
            case 'newCardSuits':
            case 'newCardStraight': d.n = 3; break;
            case 'newCardTh': d.op = '<='; d.n = 3; break;
            case 'newCardRank': d.op = '>='; d.rank = 9; break;
            case 'newCardVs': d.op = '>'; d.ref = 'top'; break;
            case 'newCardPairs': d.ref = 'any'; break;
            case 'pairGap': d.op = '>='; d.n = 4; break;
            case 'fromFlop': d.ref = 'third'; break;
        }
    }

    /**
     * Construit la condition à partir du brouillon, sans champs inutiles.
     */
    build(): RuleCondition {
        const d = this.draft;
        const constraint = (mode: ConditionDraft['kickerMode'], n: number): RankConstraint | undefined =>
            mode === 'none' ? undefined : { mode, n: Math.max(1, n || 1) };
        const negate = d.negate ? { negate: true } : {};
        switch (d.kind) {
            case 'made': {
                const made: RuleCondition = { kind: 'made', op: d.op as '>=' | '=' | '<=', level: d.level, ...negate };
                if (this.hasKicker && constraint(d.kickerMode, d.kickerN)) made.kicker = constraint(d.kickerMode, d.kickerN);
                if (d.level === 'flush' && constraint(d.flushMode, d.flushN)) made.flushRank = constraint(d.flushMode, d.flushN);
                if (d.level === 'straight' && d.straight !== 'any') made.straight = d.straight;
                if (this.hasStrength && constraint(d.strengthMode, d.strengthN)) made.strength = constraint(d.strengthMode, d.strengthN);
                return made;
            }
            case 'pocketPair': return { kind: 'pocketPair', op: d.op, rank: d.rank, ...negate };
            case 'kicker':
            case 'underpair': return { kind: d.kind, constraint: constraint(d.kickerMode === 'none' ? 'top' : d.kickerMode, d.kickerN)!, ...negate };
            case 'heroCard': {
                const heroCard: RuleCondition = { kind: 'heroCard', card: d.card, op: d.op, ref: d.ref as 'top', ...negate };
                if (d.ref === 'rank') heroCard.rank = d.rank;
                return heroCard;
            }
            case 'th': return { kind: 'th', op: d.op, n: Math.max(1, d.n || 1), ...negate };
            case 'broadway': return { kind: 'broadway', ...negate };
            case 'suited': return { kind: 'suited', ...negate };
            case 'kickerPlays': return { kind: 'kickerPlays', ...negate };
            case 'draw': {
                const draw: RuleCondition = { kind: 'draw', draw: d.draw as 'fd', ...negate };
                if (d.draw === 'fd' && constraint(d.fdMode, d.fdN)) draw.fdRank = constraint(d.fdMode, d.fdN);
                if (d.draw === 'oesd' && d.twoCards) draw.twoCards = true;
                if (d.draw === 'oesd' && d.overThird) draw.overThird = true;
                return draw;
            }
            case 'backdoor': {
                const backdoor: RuleCondition = { kind: 'backdoor', draw: d.draw as 'bdfd', ...negate };
                if (d.draw === 'bdfd' && d.highCard) backdoor.highCard = true;
                if (d.twoCards) backdoor.twoCards = true;
                if (d.draw !== 'bdfd' && d.throughTop) backdoor.throughTop = true;
                return backdoor;
            }
            case 'board': {
                switch (d.attr) {
                    case 'topRank':
                    case 'bottomRank':
                    case 'pairRank':
                    case 'unpairedRank': return { kind: 'board', attr: d.attr, op: d.op, rank: d.rank, ...negate };
                    case 'suits': return { kind: 'board', attr: 'suits', suits: d.suits as 'mono', ...negate };
                    case 'containsRank': return { kind: 'board', attr: 'containsRank', rank: d.rank, ...negate };
                    case 'broadwayCount': return { kind: 'board', attr: 'broadwayCount', op: d.op, n: Math.max(0, d.n ?? 0), ...negate };
                    case 'suitCount':
                    case 'straightCount': return { kind: 'board', attr: d.attr, op: d.op, n: Math.min(5, Math.max(1, d.n || 1)), ...negate };
                    case 'pairing': return { kind: 'board', attr: 'pairing', pairing: d.pairing, ...negate };
                    case 'newCardRank': return { kind: 'board', attr: 'newCardRank', op: d.op, rank: d.rank, ...negate };
                    case 'newCardVs': return { kind: 'board', attr: 'newCardVs', op: d.op, ref: d.ref as 'top', ...negate };
                    case 'newCardPairs': return { kind: 'board', attr: 'newCardPairs', ref: d.ref as 'top', ...negate };
                    case 'pairGap': return { kind: 'board', attr: 'pairGap', op: d.op, n: Math.max(0, d.n ?? 0), ...negate };
                    case 'fromFlop': return { kind: 'board', attr: 'fromFlop', ref: d.ref as 'top', ...negate };
                    case 'newCardSuits':
                    case 'newCardStraight': {
                        const runout: RuleCondition = { kind: 'board', attr: d.attr, n: Math.min(5, Math.max(2, d.n || 2)), ...negate };
                        if (this.hasFrom && d.from === 'flop') runout.from = 'flop';
                        return runout;
                    }
                    case 'newCardTh': {
                        const runout: RuleCondition = { kind: 'board', attr: 'newCardTh', op: d.op, n: Math.max(1, d.n || 1), ...negate };
                        if (this.hasFrom && d.from === 'flop') runout.from = 'flop';
                        return runout;
                    }
                    default: return { kind: 'board', attr: d.attr as 'paired', ...negate };
                }
            }
        }
    }

    save() {
        this.saved.emit(this.build());
    }
}
