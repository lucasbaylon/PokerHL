/**
 * Analyse d'une main du héros par rapport au board (flop, turn ou river) : main faite, tirages, backdoors, cartes hautes.
 * Fonctions pures, sans dépendance Angular, pour être utilisées par le moteur de règles et testées isolément.
 */

export type Suit = 'heart' | 'diamond' | 'club' | 'spade';

export interface PlayingCard {
    value: string;
    color: Suit;
}

export const CARD_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
export const SUITS: Suit[] = ['heart', 'diamond', 'club', 'spade'];
const ALL_RANKS = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

/**
 * Rang numérique d'une carte (2 à 14).
 * @param value Valeur de la carte ('2'..'9', 'T', 'J', 'Q', 'K', 'A').
 */
export function cardRank(value: string): number {
    return CARD_VALUES.indexOf(value) + 2;
}

/**
 * Valeur affichable d'un rang (14 → 'A').
 */
export function rankValue(rank: number): string {
    return CARD_VALUES[rank - 2];
}

/** Niveaux de main faite, du plus fort au plus faible. */
export type MadeHandLevel =
    'straight_flush' | 'quads' | 'full_house' | 'flush' | 'straight' | 'set' | 'trips' | 'two_pair' | 'overpair' |
    'top_pair' | 'pp_below_top' | 'second_pair' | 'pp_below_second' | 'third_pair' | 'pp_below_third' |
    'fourth_pair' | 'pp_below_fourth' | 'fifth_pair' | 'pp_below_board' | 'nothing';

export const MADE_HAND_LEVELS: { code: MadeHandLevel, name: string, score: number }[] = [
    { code: 'straight_flush', name: 'Quinte flush', score: 100 },
    { code: 'quads', name: 'Carré', score: 90 },
    { code: 'full_house', name: 'Full', score: 80 },
    { code: 'flush', name: 'Couleur', score: 70 },
    { code: 'straight', name: 'Quinte', score: 60 },
    { code: 'set', name: 'Set', score: 55 },
    { code: 'trips', name: 'Trips', score: 50 },
    { code: 'two_pair', name: 'Deux paires', score: 45 },
    { code: 'overpair', name: 'Overpair', score: 40 },
    { code: 'top_pair', name: 'Top pair', score: 35 },
    { code: 'pp_below_top', name: 'Paire servie sous la top card', score: 30 },
    { code: 'second_pair', name: '2nd pair', score: 25 },
    { code: 'pp_below_second', name: 'Paire servie sous la 2e carte', score: 20 },
    { code: 'third_pair', name: '3rd pair', score: 15 },
    { code: 'pp_below_third', name: 'Paire servie sous la 3e carte', score: 13 },
    { code: 'fourth_pair', name: '4th pair', score: 11 },
    { code: 'pp_below_fourth', name: 'Paire servie sous la 4e carte', score: 9 },
    { code: 'fifth_pair', name: '5th pair', score: 7 },
    { code: 'pp_below_board', name: 'Paire servie sous le board', score: 5 },
    { code: 'nothing', name: 'Aucune main faite', score: 0 }
];

export function madeHandScore(level: MadeHandLevel): number {
    return MADE_HAND_LEVELS.find(item => item.code === level)!.score;
}

/** Position d'une carte parmi les rangs possibles : 1 = la plus haute (top) ou la plus basse (bottom). */
export interface RankPosition {
    top: number;
    bottom: number;
}

export type BoardSuits = 'rainbow' | 'twoTone' | 'mono' | 'other';

/** Structure des paires du board. */
export type BoardPairing = 'unpaired' | 'paired' | 'doublePaired' | 'trips' | 'fullHouse' | 'quads';

/** Évolution du board entre un board de référence et le board actuel. */
export interface RunoutChange {
    /** Nombre maximal de cartes d'une même couleur avant les nouvelles cartes. */
    suitMaxBefore: number;
    /** Nombre maximal de cartes tenant dans une même quinte avant les nouvelles cartes. */
    straightMaxBefore: number;
    /** Meilleure position d'une nouvelle carte parmi les rangs absents du board de référence (1 = la plus haute), si l'une d'elles n'y est pas. */
    th?: number;
}

/** Dernière carte du board (turn ou river), comparée au board précédent et au flop. */
export interface RunoutFeatures {
    /** Rang de la dernière carte. */
    rank: number;
    /** Rangs distincts du board précédent, du plus haut au plus bas. */
    previousRanks: number[];
    /** Rangs distincts du flop. */
    flopRanks: number[];
    /** Le tirage couleur du flop est arrivé : une couleur présente deux fois au flop compte au moins trois cartes sur le board. */
    flopFlushDrawCompleted: boolean;
    /** Changement depuis le board précédent (dernière carte seule). */
    previous: RunoutChange;
    /** Changement depuis le flop (turn et river). */
    flop: RunoutChange;
}

export interface BoardFeatures {
    /** Rangs distincts du board, du plus haut au plus bas. */
    ranks: number[];
    top: number;
    second?: number;
    third?: number;
    bottom: number;
    /** Rang de la paire (ou du brelan) du board. */
    pairRank?: number;
    /** Rang de la plus haute carte non pairée d'un board pairé. */
    unpairedRank?: number;
    /** Rangs non pairés du board, du plus haut au plus bas : top pair puis 2e paire (sur un board pairé, les paires se comptent sur ces rangs). */
    unpairedRanks: number[];
    paired: boolean;
    suits: BoardSuits;
    straightPossible: boolean;
    connected: boolean;
    broadwayCount: number;
    /** Nombre maximal de cartes d'une même couleur (3 : couleur possible, 4 : 4-flush, 5 : couleur sur le board). */
    suitMax: number;
    /** Nombre maximal de cartes tenant dans une même quinte (3 : quinte possible, 4 : 4-straight, 5 : quinte sur le board). */
    straightMax: number;
    /** Quatre rangs consécutifs sur le board. */
    fourInRow: boolean;
    pairing: BoardPairing;
    /** Dernière carte du board (turn ou river uniquement). */
    runout?: RunoutFeatures;
}

export interface BackdoorFlush {
    /** La plus haute carte du héros fait partie du backdoor couleur. */
    highCard: boolean;
    twoCards: boolean;
}

export interface BackdoorStraight {
    twoCards: boolean;
    throughTop: boolean;
}

export interface HandFeatures {
    level: MadeHandLevel;
    score: number;
    /** Kicker (paire, trips) ou carte basse (sans main faite), parmi les rangs possibles. */
    kicker?: RankPosition;
    flushRank?: RankPosition;
    straightIsBottom?: boolean;
    pocketPairRank?: number;
    /** Paire servie sous la top card du board : position parmi les paires possibles sous la top card (hors rangs du board). */
    underpair?: RankPosition;
    /** Position de la main parmi les mains de même catégorie possibles sur ce board (quinte, couleur, full, carré, quinte flush). */
    strength?: RankPosition;
    /** Le kicker du héros joue : la main vaut plus avec lui qu'avec la seule carte qui fait la paire (ou le brelan). */
    kickerPlays: boolean;
    fd: boolean;
    fdRank?: RankPosition;
    oesd: boolean;
    /** L'OESD n'existe qu'avec les deux cartes du héros (aucune des deux ne le fait seule). */
    oesdTwoCards: boolean;
    /** L'OESD se fait avec des cartes du héros plus hautes que la 3e carte du board (la plus petite sur un board pairé). */
    oesdOverThird: boolean;
    gutshot: boolean;
    bdfd: BackdoorFlush[];
    bdsd: BackdoorStraight[];
    bdoesd: BackdoorStraight[];
    highCard: number;
    lowCard: number;
    /** Rang de la plus haute carte non pairée du héros parmi les rangs absents du board (1 = la meilleure). */
    th?: number;
    broadway: boolean;
    suited: boolean;
    board: BoardFeatures;
}

/**
 * Plus haute carte d'une quinte contenue dans un ensemble de rangs (l'As compte aussi comme 1), ou 0.
 */
function straightHigh(ranks: Iterable<number>): number {
    const set = new Set(ranks);
    if (set.has(14)) set.add(1);
    for (let high = 14; high >= 5; high--) {
        let run = true;
        for (let rank = high; rank > high - 5; rank--) {
            if (!set.has(rank)) { run = false; break; }
        }
        if (run) return high;
    }
    return 0;
}

/**
 * Nombre de rangs qui complètent une quinte utilisant au moins une carte du héros.
 * @param heroRanks Rangs du héros.
 * @param boardRanks Rangs du board.
 */
function straightOuts(heroRanks: number[], boardRanks: number[]): number {
    let outs = 0;
    for (let rank = 2; rank <= 14; rank++) {
        if (straightHigh([...heroRanks, ...boardRanks, rank]) && !straightHigh([...boardRanks, rank])) outs++;
    }
    return outs;
}

/**
 * Nombre de rangs qui complètent une quinte contenant un rang donné du board et au moins une carte du héros.
 * @param heroRanks Rangs du héros.
 * @param boardRanks Rangs du board.
 * @param through Rang du board que la quinte doit contenir.
 */
function straightOutsThrough(heroRanks: number[], boardRanks: number[], through: number): number {
    const withLowAce = (ranks: number[]) => new Set(ranks.includes(14) ? [...ranks, 1] : ranks);
    const hero = withLowAce(heroRanks);
    let outs = 0;
    for (let rank = 2; rank <= 14; rank++) {
        const all = withLowAce([...heroRanks, ...boardRanks, rank]);
        const board = withLowAce([...boardRanks, rank]);
        for (let high = 5; high <= 14; high++) {
            const window = [high, high - 1, high - 2, high - 3, high - 4];
            if (!window.includes(through) && !(through === 14 && high === 5)) continue;
            if (window.every(item => all.has(item)) && !window.every(item => board.has(item)) && window.some(item => hero.has(item))) {
                outs++;
                break;
            }
        }
    }
    return outs;
}

/**
 * Tirage par les deux bouts : 4 rangs consécutifs (de 2-5 à T-K) formés avec au moins une carte du héros.
 * @param heroRanks Rangs du héros.
 * @param boardRanks Rangs du board.
 * @param through Rang du board que les 4 rangs doivent contenir (facultatif).
 */
function openEnded(heroRanks: number[], boardRanks: number[], through?: number): boolean {
    const all = new Set([...heroRanks, ...boardRanks]);
    for (let low = 2; low <= 10; low++) {
        const run = [low, low + 1, low + 2, low + 3];
        if (run.every(rank => all.has(rank)) && run.some(rank => heroRanks.includes(rank))
            && !run.every(rank => boardRanks.includes(rank)) && (through === undefined || run.includes(through))) return true;
    }
    return false;
}

/** Base de codage des valeurs de mains (rangs de 2 à 14). */
const VALUE_BASE = 15;

/**
 * Valeur exacte de la meilleure main de 5 cartes (ou moins si le board est incomplet) : plus elle est grande, plus la main est forte.
 * @param cards Cartes disponibles (jusqu'à 7).
 */
export function handValue(cards: PlayingCard[]): number {
    const encode = (category: number, ranks: number[]) =>
        [...ranks, 0, 0, 0, 0, 0].slice(0, 5).reduce((value, rank) => value * VALUE_BASE + rank, category);
    const ranks = cards.map(card => cardRank(card.value)).sort((a, b) => b - a);
    const flushRanks = (suit: Suit) => cards.filter(card => card.color === suit).map(card => cardRank(card.value)).sort((a, b) => b - a);
    const flushSuit = SUITS.find(suit => flushRanks(suit).length >= 5);
    if (flushSuit) {
        const straightFlush = straightHigh(flushRanks(flushSuit));
        if (straightFlush) return encode(8, [straightFlush]);
    }
    const counts = new Map<number, number>();
    ranks.forEach(rank => counts.set(rank, (counts.get(rank) ?? 0) + 1));
    // Groupes triés par nombre de cartes puis par rang
    const groups = [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
    const kickers = (exclude: number[], n: number) => ranks.filter(rank => !exclude.includes(rank)).slice(0, n);
    if (groups[0][1] >= 4) return encode(7, [groups[0][0], ...kickers([groups[0][0]], 1)]);
    if (groups[0][1] === 3) {
        const pair = groups.slice(1).find(([, count]) => count >= 2);
        if (pair) return encode(6, [groups[0][0], pair[0]]);
    }
    if (flushSuit) return encode(5, flushRanks(flushSuit));
    const straight = straightHigh(ranks);
    if (straight) return encode(4, [straight]);
    if (groups[0][1] === 3) return encode(3, [groups[0][0], ...kickers([groups[0][0]], 2)]);
    if (groups[0][1] === 2 && groups[1]?.[1] === 2) {
        const pairs = [groups[0][0], groups[1][0]];
        return encode(2, [...pairs, ...kickers(pairs, 1)]);
    }
    if (groups[0][1] === 2) return encode(1, [groups[0][0], ...kickers([groups[0][0]], 3)]);
    return encode(0, ranks);
}

/**
 * Catégorie d'une valeur de main (0 : carte haute … 8 : quinte flush).
 */
export function handCategory(value: number): number {
    return Math.floor(value / VALUE_BASE ** 5);
}

/**
 * Position d'une valeur de main parmi les mains de même catégorie possibles sur un board (toutes les combinaisons de deux cartes hors board).
 * @param value Valeur de la main du héros.
 * @param board Cartes du board.
 */
function strengthAmongPossible(value: number, board: PlayingCard[]): RankPosition {
    const category = handCategory(value);
    const deck = CARD_VALUES.flatMap(cardValue => SUITS.map(color => ({ value: cardValue, color })))
        .filter(card => !board.some(item => item.value === card.value && item.color === card.color));
    const values = new Set<number>([value]);
    for (let i = 0; i < deck.length; i++) {
        for (let j = i + 1; j < deck.length; j++) {
            const other = handValue([deck[i], deck[j], ...board]);
            if (handCategory(other) === category) values.add(other);
        }
    }
    return rankPosition(value, [...values]);
}

/**
 * Position d'un rang parmi une liste de rangs possibles.
 */
function rankPosition(rank: number, possible: number[]): RankPosition {
    return {
        top: 1 + possible.filter(item => item > rank).length,
        bottom: 1 + possible.filter(item => item < rank).length
    };
}

/** Rangs avec l'As compté aussi comme 1 (roue). */
function withLowAce(ranks: number[]): number[] {
    return ranks.includes(14) ? [...ranks, 1] : ranks;
}

/**
 * Nombre maximal de cartes d'une même couleur.
 */
function suitMaxOf(board: PlayingCard[]): number {
    return Math.max(...SUITS.map(suit => board.filter(card => card.color === suit).length));
}

/**
 * Nombre maximal de rangs distincts tenant dans une même quinte (fenêtre de 5 rangs, As bas compris).
 */
function straightMaxOf(board: PlayingCard[]): number {
    const ranks = withLowAce([...new Set(board.map(card => cardRank(card.value)))]);
    let max = 0;
    for (let low = 1; low <= 10; low++) {
        max = Math.max(max, ranks.filter(rank => rank >= low && rank <= low + 4).length);
    }
    return max;
}

/**
 * Évolution entre un board de référence et les cartes arrivées depuis.
 */
function runoutChange(reference: PlayingCard[], added: PlayingCard[]): RunoutChange {
    const referenceRanks = reference.map(card => cardRank(card.value));
    const absent = ALL_RANKS.filter(rank => !referenceRanks.includes(rank));
    const positions = added.map(card => cardRank(card.value))
        .filter(rank => absent.includes(rank))
        .map(rank => rankPosition(rank, absent).top);
    return {
        suitMaxBefore: suitMaxOf(reference),
        straightMaxBefore: straightMaxOf(reference),
        th: positions.length ? Math.min(...positions) : undefined
    };
}

/**
 * Caractéristiques du board, indépendantes de la main du héros.
 * Au turn et à la river, le board garde l'ordre de distribution : les trois cartes du flop, puis la turn, puis la river.
 * @param board Cartes du board (3 à 5).
 */
export function evaluateBoard(board: PlayingCard[]): BoardFeatures {
    const boardRanks = board.map(card => cardRank(card.value));
    const ranks = [...new Set(boardRanks)].sort((a, b) => b - a);
    const counts = new Map<number, number>();
    boardRanks.forEach(rank => counts.set(rank, (counts.get(rank) ?? 0) + 1));
    const pairRank = [...counts].filter(([, count]) => count >= 2).map(([rank]) => rank).sort((a, b) => b - a)[0];
    const suitCounts = SUITS.map(suit => board.filter(card => card.color === suit).length).filter(count => count > 0);
    let suits: BoardSuits = 'other';
    if (board.length === 3) {
        suits = suitCounts.length === 1 ? 'mono' : suitCounts.length === 2 ? 'twoTone' : 'rainbow';
    } else if (suitCounts.length === board.length) {
        suits = 'rainbow';
    }
    // Quinte possible : les rangs du board tiennent, à 3, dans une fenêtre de 5 (As bas compris)
    const straightMax = straightMaxOf(board);
    const lowAce = withLowAce(ranks);
    // Connecté : deux rangs distincts pouvant faire partie d'une même quinte (4 rangs d'écart ou moins)
    const connected = lowAce.some((a, i) => lowAce.some((b, j) => i !== j && a !== b && Math.abs(a - b) <= 4));
    const fourInRow = lowAce.some(rank => [1, 2, 3].every(step => lowAce.includes(rank + step)));
    const sizes = [...counts.values()].sort((a, b) => b - a);
    const pairing: BoardPairing = sizes[0] >= 4 ? 'quads'
        : sizes[0] === 3 ? (sizes[1] >= 2 ? 'fullHouse' : 'trips')
        : sizes[0] === 2 ? (sizes[1] === 2 ? 'doublePaired' : 'paired')
        : 'unpaired';
    const runout: RunoutFeatures | undefined = board.length > 3
        ? {
            rank: boardRanks[boardRanks.length - 1],
            previousRanks: [...new Set(boardRanks.slice(0, -1))].sort((a, b) => b - a),
            flopRanks: [...new Set(boardRanks.slice(0, 3))],
            flopFlushDrawCompleted: SUITS.some(suit => board.slice(0, 3).filter(card => card.color === suit).length === 2
                && board.filter(card => card.color === suit).length >= 3),
            previous: runoutChange(board.slice(0, -1), board.slice(-1)),
            flop: runoutChange(board.slice(0, 3), board.slice(3))
        }
        : undefined;
    return {
        ranks,
        top: ranks[0],
        second: ranks[1],
        third: ranks[2],
        bottom: ranks[ranks.length - 1],
        pairRank,
        unpairedRank: pairRank === undefined ? undefined : [...counts].filter(([, count]) => count === 1).map(([rank]) => rank).sort((a, b) => b - a)[0],
        unpairedRanks: [...counts].filter(([, count]) => count === 1).map(([rank]) => rank).sort((a, b) => b - a),
        paired: pairRank !== undefined,
        suits,
        straightPossible: straightMax >= 3,
        connected,
        broadwayCount: boardRanks.filter(rank => rank >= 10).length,
        suitMax: suitMaxOf(board),
        straightMax,
        fourInRow,
        pairing,
        runout
    };
}

/**
 * Analyse la main du héros sur un board.
 * @param hero Les deux cartes du héros.
 * @param board Les cartes du board (3 à 5), dans l'ordre de distribution.
 */
export function evaluateHand(hero: PlayingCard[], board: PlayingCard[]): HandFeatures {
    const boardFeatures = evaluateBoard(board);
    const heroRanks = hero.map(card => cardRank(card.value));
    const boardRanks = board.map(card => cardRank(card.value));
    const [highCard, lowCard] = [...heroRanks].sort((a, b) => b - a);
    const all = [...hero, ...board];
    const allRanks = all.map(card => cardRank(card.value));
    const rankCounts = new Map<number, number>();
    allRanks.forEach(rank => rankCounts.set(rank, (rankCounts.get(rank) ?? 0) + 1));
    const boardCount = (rank: number) => boardRanks.filter(item => item === rank).length;
    const notOnBoard = ALL_RANKS.filter(rank => !boardRanks.includes(rank));

    // Couleur
    const flushSuit = SUITS.find(suit => all.filter(card => card.color === suit).length >= 5);
    const suitRanks = (suit: Suit, cards: PlayingCard[]) => cards.filter(card => card.color === suit).map(card => cardRank(card.value));
    const heroSuitRank = (suit: Suit) => Math.max(...suitRanks(suit, hero));
    const possibleInSuit = (suit: Suit) => ALL_RANKS.filter(rank => !suitRanks(suit, board).includes(rank));

    const heroStraight = straightHigh(allRanks);
    const quadsRank = [...rankCounts].find(([, count]) => count >= 4)?.[0];
    const tripsRanks = [...rankCounts].filter(([, count]) => count >= 3).map(([rank]) => rank);
    const pairRanks = [...rankCounts].filter(([, count]) => count >= 2).map(([rank]) => rank);
    const heroValue = handValue(all);
    const boardStraight = straightHigh(boardRanks);
    const river = board.length === 5;
    // River : le héros joue le board quand ses cartes n'améliorent pas la meilleure main des cinq cartes du board
    const playsBoard = river && heroValue === handValue(board);

    let level: MadeHandLevel = 'nothing';
    let kicker: RankPosition | undefined;
    let flushRank: RankPosition | undefined;
    let straightIsBottom: boolean | undefined;
    let kickerPlays = false;
    const pocketPairRank = heroRanks[0] === heroRanks[1] ? heroRanks[0] : undefined;
    // Le kicker joue si la main vaut plus qu'avec la seule carte du héros qui fait la paire (ou le brelan)
    const kickerCounts = (madeRank: number) =>
        heroValue > handValue([hero.find(card => cardRank(card.value) === madeRank)!, ...board]);

    // Carré sur le board : seule la plus haute carte compte
    if (playsBoard || boardFeatures.pairing === 'quads') {
        kicker = rankPosition(lowCard, notOnBoard.filter(rank => rank !== highCard));
    } else if (flushSuit && straightHigh(suitRanks(flushSuit, all)) && suitRanks(flushSuit, hero).length) {
        level = 'straight_flush';
    } else if (quadsRank !== undefined && heroRanks.includes(quadsRank)) {
        level = 'quads';
    } else if (tripsRanks.length && pairRanks.length >= 2 && (heroRanks.some(rank => pairRanks.includes(rank)))) {
        level = 'full_house';
    } else if (flushSuit && suitRanks(flushSuit, hero).length) {
        level = 'flush';
        flushRank = rankPosition(heroSuitRank(flushSuit), possibleInSuit(flushSuit));
    } else if (heroStraight > boardStraight) {
        level = 'straight';
        // Quinte la plus basse possible sur ce board (au-dessus d'une quinte du board), toutes combinaisons de deux rangs confondues
        let lowest = 15;
        for (const a of ALL_RANKS) {
            for (const b of ALL_RANKS) {
                const high = straightHigh([...boardRanks, a, b]);
                if (high > boardStraight && high < lowest) lowest = high;
            }
        }
        straightIsBottom = heroStraight === lowest;
    } else if (pocketPairRank !== undefined) {
        if (boardCount(pocketPairRank) >= 1) {
            level = 'set';
        } else {
            const ranks = boardFeatures.ranks;
            if (pocketPairRank > ranks[0]) level = 'overpair';
            else if (ranks.length > 1 && pocketPairRank > ranks[1]) level = 'pp_below_top';
            else if (ranks.length > 2 && pocketPairRank > ranks[2]) level = 'pp_below_second';
            else if (ranks.length > 3 && pocketPairRank > ranks[3]) level = 'pp_below_third';
            else if (ranks.length > 4 && pocketPairRank > ranks[4]) level = 'pp_below_fourth';
            else level = 'pp_below_board';
        }
    } else {
        const matching = heroRanks.filter(rank => boardRanks.includes(rank));
        const tripsRank = matching.find(rank => boardCount(rank) >= 2);
        // Paires comptées sur les rangs non pairés du board
        const unpaired = boardFeatures.ranks.filter(rank => boardCount(rank) === 1);
        if (tripsRank !== undefined) {
            level = 'trips';
            const kickerRank = heroRanks.find(rank => rank !== tripsRank)!;
            kicker = rankPosition(kickerRank, notOnBoard);
            kickerPlays = kickerCounts(tripsRank);
        } else if (matching.length === 2) {
            level = 'two_pair';
        } else if (matching.length === 1) {
            const index = unpaired.indexOf(matching[0]);
            const pairLevels: MadeHandLevel[] = ['top_pair', 'second_pair', 'third_pair', 'fourth_pair', 'fifth_pair'];
            level = pairLevels[Math.max(0, index)] ?? 'fifth_pair';
            const kickerRank = heroRanks.find(rank => rank !== matching[0])!;
            kicker = rankPosition(kickerRank, notOnBoard);
            kickerPlays = kickerCounts(matching[0]);
        } else {
            kicker = rankPosition(lowCard, notOnBoard.filter(rank => rank !== highCard));
        }
    }

    const strength = ['straight', 'flush', 'full_house', 'quads', 'straight_flush'].includes(level)
        ? strengthAmongPossible(heroValue, board)
        : undefined;

    // Tirages couleur (plus de tirage à la river)
    const heroSuits = SUITS.filter(suit => suitRanks(suit, hero).length > 0);
    const fdSuit = river || level === 'flush' || level === 'straight_flush'
        ? undefined
        : heroSuits.find(suit => all.filter(card => card.color === suit).length === 4);
    const fdRank = fdSuit ? rankPosition(heroSuitRank(fdSuit), possibleInSuit(fdSuit)) : undefined;

    // Tirages quinte
    const hasStraight = level === 'straight' || level === 'straight_flush';
    const outs = river || hasStraight ? 0 : straightOuts(heroRanks, boardRanks);
    const oesd = outs >= 2;
    const oesdTwoCards = oesd && Math.max(...heroRanks.map(rank => straightOuts([rank], boardRanks))) < 2;
    const overThirdRanks = heroRanks.filter(rank => rank > (boardFeatures.third ?? boardFeatures.bottom));
    const oesdOverThird = oesd && overThirdRanks.length > 0 && straightOuts(overThirdRanks, boardRanks) >= 2;
    const gutshot = outs === 1;

    // Backdoors (flop uniquement)
    const bdfd: BackdoorFlush[] = [];
    const bdsd: BackdoorStraight[] = [];
    const bdoesd: BackdoorStraight[] = [];
    if (board.length === 3) {
        if (!fdSuit && level !== 'flush' && level !== 'straight_flush') {
            for (const suit of heroSuits) {
                if (all.filter(card => card.color === suit).length === 3) {
                    bdfd.push({
                        highCard: suitRanks(suit, hero).includes(highCard),
                        twoCards: suitRanks(suit, hero).length === 2
                    });
                }
            }
        }
        if (!hasStraight) {
            for (let turn = 2; turn <= 14; turn++) {
                if (straightHigh([...heroRanks, ...boardRanks, turn])) continue;
                const turnOuts = straightOuts(heroRanks, [...boardRanks, turn]);
                if (!turnOuts) continue;
                const singleOuts = Math.max(...heroRanks.map(rank => straightOuts([rank], [...boardRanks, turn])));
                // Tirage du turn dont la quinte passe par la top card du flop
                const topOuts = straightOutsThrough(heroRanks, [...boardRanks, turn], boardFeatures.top);
                if (!oesd && !gutshot) {
                    bdsd.push({ twoCards: singleOuts === 0, throughTop: topOuts >= 1 });
                }
                // BDOESD : le turn donne 4 cartes consécutives ouvertes aux deux bouts (un double gutshot ne compte pas)
                const turnBoard = [...boardRanks, turn];
                if (!oesd && openEnded(heroRanks, turnBoard)) {
                    bdoesd.push({
                        twoCards: !heroRanks.some(rank => openEnded([rank], turnBoard)),
                        throughTop: openEnded(heroRanks, turnBoard, boardFeatures.top)
                    });
                }
            }
        }
    }

    // Carte haute non pairée parmi les rangs absents du board
    const unpairedHero = heroRanks.filter(rank => !boardRanks.includes(rank));
    const th = pocketPairRank === undefined && unpairedHero.length
        ? rankPosition(Math.max(...unpairedHero), notOnBoard).top
        : undefined;

    return {
        level,
        score: madeHandScore(level),
        kicker,
        flushRank,
        straightIsBottom,
        pocketPairRank,
        underpair: pocketPairRank !== undefined && pocketPairRank < boardFeatures.top && !boardRanks.includes(pocketPairRank)
            ? rankPosition(pocketPairRank, notOnBoard.filter(rank => rank < boardFeatures.top))
            : undefined,
        strength,
        kickerPlays,
        fd: !!fdSuit,
        fdRank,
        oesd,
        oesdTwoCards,
        oesdOverThird,
        gutshot,
        bdfd,
        bdsd,
        bdoesd,
        highCard,
        lowCard,
        th,
        broadway: lowCard >= 10,
        suited: hero[0].color === hero[1].color,
        board: boardFeatures
    };
}
