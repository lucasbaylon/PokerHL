/**
 * Moteur de règles des situations flop : une règle associe des conditions (toutes requises) à une action.
 * La première règle dont les conditions sont remplies donne l'action attendue, sinon l'action par défaut s'applique.
 */
import { BoardFeatures, BoardSuits, HandFeatures, MADE_HAND_LEVELS, MadeHandLevel, RankPosition, madeHandScore, rankValue } from './hand-evaluator';

export type Comparator = '>' | '>=' | '=' | '<=' | '<';

/** Contrainte sur la position d'une carte parmi les rangs possibles. */
export interface RankConstraint {
    mode: 'top' | 'notTop' | 'bottom' | 'notBottom';
    n: number;
}

export type RuleCondition = { negate?: boolean } & (
    | { kind: 'made', op: '>=' | '=' | '<=', level: MadeHandLevel, kicker?: RankConstraint, flushRank?: RankConstraint, straight?: 'bottom' | 'notBottom' }
    | { kind: 'pocketPair', op: Comparator, rank: number }
    | { kind: 'underpair', constraint: RankConstraint }
    | { kind: 'draw', draw: 'fd' | 'oesd' | 'gutshot' | 'straightDraw' | 'combo' | 'any', fdRank?: RankConstraint }
    | { kind: 'backdoor', draw: 'bdfd' | 'bdsd' | 'bdoesd', highCard?: boolean, twoCards?: boolean, throughTop?: boolean }
    | { kind: 'heroCard', card: 'high' | 'low' | 'any', op: Comparator, ref: 'top' | 'second' | 'third' | 'bottom' | 'pair' | 'rank', rank?: number }
    | { kind: 'kicker', constraint: RankConstraint }
    | { kind: 'th', op: Comparator, n: number }
    | { kind: 'broadway' }
    | { kind: 'suited' }
    | { kind: 'board', attr: 'topRank' | 'bottomRank' | 'pairRank' | 'unpairedRank', op: Comparator, rank: number }
    | { kind: 'board', attr: 'suits', suits: Exclude<BoardSuits, 'other'> }
    | { kind: 'board', attr: 'paired' | 'straightPossible' | 'connected' }
    | { kind: 'board', attr: 'containsRank', rank: number }
    | { kind: 'board', attr: 'broadwayCount', op: Comparator, n: number }
);

export type ConditionKind = RuleCondition['kind'];

export type BoardCondition = Extract<RuleCondition, { kind: 'board' }>;

export interface FlopRule {
    id: string;
    conditions: RuleCondition[];
    solutionId?: string;
}

function compare(value: number, op: Comparator, target: number): boolean {
    switch (op) {
        case '>': return value > target;
        case '>=': return value >= target;
        case '=': return value === target;
        case '<=': return value <= target;
        case '<': return value < target;
    }
}

function matchRank(position: RankPosition | undefined, constraint: RankConstraint | undefined): boolean {
    if (!constraint) return true;
    if (!position) return false;
    switch (constraint.mode) {
        case 'top': return position.top <= constraint.n;
        case 'notTop': return position.top > constraint.n;
        case 'bottom': return position.bottom <= constraint.n;
        case 'notBottom': return position.bottom > constraint.n;
    }
}

/**
 * Vérifie une condition de board seule (utilisée aussi pour filtrer les flops d'une situation).
 */
export function matchBoardCondition(condition: BoardCondition, board: BoardFeatures): boolean {
    const result = (() => {
        switch (condition.attr) {
            case 'topRank': return compare(board.top, condition.op, condition.rank);
            case 'bottomRank': return compare(board.bottom, condition.op, condition.rank);
            case 'pairRank': return board.pairRank !== undefined && compare(board.pairRank, condition.op, condition.rank);
            case 'unpairedRank': return board.unpairedRank !== undefined && compare(board.unpairedRank, condition.op, condition.rank);
            case 'suits': return board.suits === condition.suits;
            case 'paired': return board.paired;
            case 'straightPossible': return board.straightPossible;
            case 'connected': return board.connected;
            case 'containsRank': return board.ranks.includes(condition.rank);
            case 'broadwayCount': return compare(board.broadwayCount, condition.op, condition.n);
        }
    })();
    return condition.negate ? !result : result;
}

/**
 * Vérifie une condition sur une main analysée.
 */
export function matchCondition(condition: RuleCondition, hand: HandFeatures): boolean {
    if (condition.kind === 'board') return matchBoardCondition(condition, hand.board);
    const result = (() => {
        switch (condition.kind) {
            case 'made': {
                const target = madeHandScore(condition.level);
                const qualifies = matchRank(hand.kicker, condition.kicker)
                    && matchRank(hand.flushRank, condition.flushRank)
                    && (!condition.straight || (condition.straight === 'bottom') === !!hand.straightIsBottom);
                if (condition.op === '=') return hand.score === target && qualifies;
                if (condition.op === '>=') return hand.score > target || (hand.score === target && qualifies);
                return hand.score < target || (hand.score === target && qualifies);
            }
            case 'pocketPair':
                return hand.pocketPairRank !== undefined && compare(hand.pocketPairRank, condition.op, condition.rank);
            case 'underpair': return matchRank(hand.underpair, condition.constraint);
            case 'draw': {
                const straightDraw = hand.oesd || hand.gutshot;
                switch (condition.draw) {
                    case 'fd': return hand.fd && matchRank(hand.fdRank, condition.fdRank);
                    case 'oesd': return hand.oesd;
                    case 'gutshot': return hand.gutshot;
                    case 'straightDraw': return straightDraw;
                    case 'combo': return hand.fd && straightDraw;
                    case 'any': return hand.fd || straightDraw;
                }
                return false;
            }
            case 'backdoor': {
                if (condition.draw === 'bdfd') {
                    return hand.bdfd.some(item => (!condition.highCard || item.highCard) && (!condition.twoCards || item.twoCards));
                }
                const list = condition.draw === 'bdsd' ? hand.bdsd : hand.bdoesd;
                return list.some(item => (!condition.twoCards || item.twoCards) && (!condition.throughTop || item.throughTop));
            }
            case 'heroCard': {
                const cards = { high: [hand.highCard], low: [hand.lowCard], any: [hand.highCard, hand.lowCard] }[condition.card];
                const references: Record<string, number | undefined> = {
                    top: hand.board.top,
                    second: hand.board.second,
                    third: hand.board.third,
                    bottom: hand.board.bottom,
                    pair: hand.board.pairRank,
                    rank: condition.rank
                };
                const reference = references[condition.ref];
                return reference !== undefined && cards.some(card => compare(card, condition.op, reference));
            }
            case 'kicker': return matchRank(hand.kicker, condition.constraint);
            case 'th': return hand.th !== undefined && compare(hand.th, condition.op, condition.n);
            case 'broadway': return hand.broadway;
            case 'suited': return hand.suited;
        }
    })();
    return condition.negate ? !result : result;
}

/**
 * Action attendue pour une main : première règle remplie, sinon l'action par défaut.
 * @returns L'identifiant de la solution et l'index de la règle (-1 pour l'action par défaut).
 */
export function resolveAction(rules: FlopRule[], defaultSolutionId: string | undefined, hand: HandFeatures): { solutionId?: string, ruleIndex: number } {
    const ruleIndex = rules.findIndex(rule => rule.conditions.every(condition => matchCondition(condition, hand)));
    return ruleIndex === -1
        ? { solutionId: defaultSolutionId, ruleIndex }
        : { solutionId: rules[ruleIndex].solutionId, ruleIndex };
}

/**
 * Caractéristiques détectées d'une main, en libellés lisibles.
 */
export function describeHand(hand: HandFeatures): string[] {
    const level = MADE_HAND_LEVELS.find(item => item.code === hand.level)!;
    const labels: string[] = [];
    if (hand.level !== 'nothing') {
        const details = [
            hand.kicker ? `kicker top ${hand.kicker.top}` : '',
            hand.flushRank ? `couleur top ${hand.flushRank.top}` : '',
            hand.straightIsBottom ? 'la plus basse' : ''
        ].filter(Boolean).join(', ');
        labels.push(`${level.name}${details ? ` (${details})` : ''}`);
    } else {
        labels.push(level.name);
        if (hand.th !== undefined) labels.push(`Carte haute : ${ordinal(hand.th)} meilleure absente du board`);
    }
    if (hand.fd) labels.push(`Tirage couleur${hand.fdRank ? ` (carte top ${hand.fdRank.top})` : ''}`);
    if (hand.oesd) labels.push('OESD');
    if (hand.gutshot) labels.push('Gutshot');
    if (hand.bdfd.length) {
        const details = [hand.bdfd.some(item => item.highCard) ? 'carte haute' : '', hand.bdfd.some(item => item.twoCards) ? 'à 2 cartes' : ''].filter(Boolean).join(', ');
        labels.push(`BDFD${details ? ` (${details})` : ''}`);
    }
    if (hand.bdoesd.length) labels.push('BDOESD');
    else if (hand.bdsd.length) labels.push('BDSD');
    if (hand.broadway) labels.push('Broadway');
    return labels;
}

/** Nombre ordinal court : 1re, 2e, 3e… */
function ordinal(n: number): string {
    return n === 1 ? '1re' : `${n}e`;
}

const COMPARATOR_LABELS: Record<Comparator, string> = { '>': '>', '>=': '≥', '=': '=', '<=': '≤', '<': '<' };

export const RANK_OPTIONS = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2].map(rank => ({ rank, name: rankValue(rank) }));

function describeRank(constraint: RankConstraint | undefined, noun: string): string {
    if (!constraint) return '';
    const labels: Record<RankConstraint['mode'], string> = {
        top: `${noun} top ${constraint.n}`,
        notTop: `${noun} hors top ${constraint.n}`,
        bottom: `${noun} parmi les ${constraint.n} plus bas`,
        notBottom: `${noun} sans les ${constraint.n} plus bas`
    };
    return labels[constraint.mode];
}

const HERO_CARD_REFS: Record<string, string> = {
    top: 'la top card', second: 'la 2e carte', third: 'la 3e carte', bottom: 'la plus petite carte', pair: 'la paire du board'
};

/**
 * Libellé lisible d'une condition.
 */
export function describeCondition(condition: RuleCondition): string {
    const text = (() => {
        switch (condition.kind) {
            case 'made': {
                const name = MADE_HAND_LEVELS.find(level => level.code === condition.level)?.name ?? condition.level;
                const details = [
                    describeRank(condition.kicker, 'kicker'),
                    describeRank(condition.flushRank, 'couleur'),
                    condition.straight === 'bottom' ? 'la plus basse' : condition.straight === 'notBottom' ? 'pas la plus basse' : ''
                ].filter(Boolean).join(', ');
                const prefix = condition.op === '=' ? '' : `${COMPARATOR_LABELS[condition.op]} `;
                return `${prefix}${name}${details ? ` (${details})` : ''}`;
            }
            case 'pocketPair': return `Paire servie ${COMPARATOR_LABELS[condition.op]} ${rankValue(condition.rank)}${rankValue(condition.rank)}`;
            case 'underpair': {
                const { mode, n } = condition.constraint;
                const labels: Record<RankConstraint['mode'], string> = {
                    top: `parmi les ${n} plus hautes`,
                    notTop: `hors des ${n} plus hautes`,
                    bottom: `parmi les ${n} plus basses`,
                    notBottom: `sans les ${n} plus basses`
                };
                return `Paire servie sous la top card, ${labels[mode]}`;
            }
            case 'draw': {
                const names = { fd: 'Tirage couleur', oesd: 'OESD', gutshot: 'Gutshot', straightDraw: 'Tirage quinte', combo: 'Combo-draw', any: 'Tirage' };
                const details = describeRank(condition.fdRank, 'carte');
                return `${names[condition.draw]}${details ? ` (${details})` : ''}`;
            }
            case 'backdoor': {
                const names = { bdfd: 'BDFD', bdsd: 'BDSD', bdoesd: 'BDOESD' };
                const details = [
                    condition.highCard ? 'carte haute' : '',
                    condition.twoCards ? 'à 2 cartes' : '',
                    condition.throughTop ? 'par la top card' : ''
                ].filter(Boolean).join(', ');
                return `${names[condition.draw]}${details ? ` (${details})` : ''}`;
            }
            case 'heroCard': {
                const card = { high: 'Carte haute', low: 'Carte basse', any: 'Une carte du héros' }[condition.card];
                const reference = condition.ref === 'rank' ? rankValue(condition.rank ?? 2) : HERO_CARD_REFS[condition.ref];
                return `${card} ${COMPARATOR_LABELS[condition.op]} ${reference}`;
            }
            case 'kicker': return describeRank(condition.constraint, 'Kicker');
            case 'th': return `Carte haute ${COMPARATOR_LABELS[condition.op]} ${ordinal(condition.n)} meilleure absente du board`;
            case 'broadway': return 'Broadway';
            case 'suited': return 'Main assortie';
            case 'board': {
                switch (condition.attr) {
                    case 'topRank': return `Board : top card ${COMPARATOR_LABELS[condition.op]} ${rankValue(condition.rank)}`;
                    case 'bottomRank': return `Board : plus petite carte ${COMPARATOR_LABELS[condition.op]} ${rankValue(condition.rank)}`;
                    case 'pairRank': return `Board : paire ${COMPARATOR_LABELS[condition.op]} ${rankValue(condition.rank)}`;
                    case 'unpairedRank': return `Board : carte non pairée ${COMPARATOR_LABELS[condition.op]} ${rankValue(condition.rank)}`;
                    case 'suits': return `Board ${{ rainbow: 'arc-en-ciel', twoTone: 'two-tone', mono: 'monotone' }[condition.suits]}`;
                    case 'paired': return 'Board pairé';
                    case 'straightPossible': return 'Board : quinte possible';
                    case 'connected': return 'Board connecté (2 cartes à 4 rangs ou moins)';
                    case 'containsRank': return `Board contient ${rankValue(condition.rank)}`;
                    case 'broadwayCount': return `Board : cartes ≥ T ${COMPARATOR_LABELS[condition.op]} ${condition.n}`;
                }
            }
        }
        return '';
    })();
    return condition.negate ? `Non : ${text}` : text;
}
