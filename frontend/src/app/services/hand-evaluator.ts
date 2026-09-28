/**
 * Analyse d'une main du héros par rapport au board : main faite, tirages, backdoors, cartes hautes.
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
    'top_pair' | 'pp_below_top' | 'second_pair' | 'pp_below_second' | 'third_pair' | 'pp_below_board' | 'nothing';

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
    { code: 'pp_below_board', name: 'Paire servie sous le board', score: 10 },
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
    paired: boolean;
    suits: BoardSuits;
    straightPossible: boolean;
    connected: boolean;
    broadwayCount: number;
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
    fd: boolean;
    fdRank?: RankPosition;
    oesd: boolean;
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
 * Position d'un rang parmi une liste de rangs possibles.
 */
function rankPosition(rank: number, possible: number[]): RankPosition {
    return {
        top: 1 + possible.filter(item => item > rank).length,
        bottom: 1 + possible.filter(item => item < rank).length
    };
}

/**
 * Caractéristiques du board, indépendantes de la main du héros.
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
    const withLowAce = ranks.includes(14) ? [...ranks, 1] : ranks;
    let straightPossible = false;
    for (let low = 1; low <= 10 && !straightPossible; low++) {
        straightPossible = withLowAce.filter(rank => rank >= low && rank <= low + 4).length >= 3;
    }
    // Connecté : deux rangs distincts pouvant faire partie d'une même quinte (4 rangs d'écart ou moins)
    const connected = withLowAce.some((a, i) => withLowAce.some((b, j) => i !== j && a !== b && Math.abs(a - b) <= 4));
    return {
        ranks,
        top: ranks[0],
        second: ranks[1],
        third: ranks[2],
        bottom: ranks[ranks.length - 1],
        pairRank,
        unpairedRank: pairRank === undefined ? undefined : [...counts].filter(([, count]) => count === 1).map(([rank]) => rank).sort((a, b) => b - a)[0],
        paired: pairRank !== undefined,
        suits,
        straightPossible,
        connected,
        broadwayCount: boardRanks.filter(rank => rank >= 10).length
    };
}

/**
 * Analyse la main du héros sur un board.
 * @param hero Les deux cartes du héros.
 * @param board Les cartes du board (flop : 3 cartes).
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

    let level: MadeHandLevel = 'nothing';
    let kicker: RankPosition | undefined;
    let flushRank: RankPosition | undefined;
    let straightIsBottom: boolean | undefined;
    const pocketPairRank = heroRanks[0] === heroRanks[1] ? heroRanks[0] : undefined;

    if (flushSuit && straightHigh(suitRanks(flushSuit, all)) && suitRanks(flushSuit, hero).length) {
        level = 'straight_flush';
    } else if (quadsRank !== undefined && heroRanks.includes(quadsRank)) {
        level = 'quads';
    } else if (tripsRanks.length && pairRanks.length >= 2 && (heroRanks.some(rank => pairRanks.includes(rank)))) {
        level = 'full_house';
    } else if (flushSuit && suitRanks(flushSuit, hero).length) {
        level = 'flush';
        flushRank = rankPosition(heroSuitRank(flushSuit), possibleInSuit(flushSuit));
    } else if (heroStraight && !straightHigh(boardRanks)) {
        level = 'straight';
        // Quinte la plus basse possible sur ce board, toutes combinaisons de deux rangs confondues
        let lowest = 15;
        for (const a of ALL_RANKS) {
            for (const b of ALL_RANKS) {
                const high = straightHigh([...boardRanks, a, b]);
                if (high && high < lowest) lowest = high;
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
        } else if (matching.length === 2) {
            level = 'two_pair';
        } else if (matching.length === 1) {
            const index = unpaired.indexOf(matching[0]);
            level = index === 0 ? 'top_pair' : index === 1 ? 'second_pair' : 'third_pair';
            const kickerRank = heroRanks.find(rank => rank !== matching[0])!;
            kicker = rankPosition(kickerRank, notOnBoard);
        } else {
            kicker = rankPosition(lowCard, notOnBoard.filter(rank => rank !== highCard));
        }
    }

    // Tirages couleur
    const heroSuits = SUITS.filter(suit => suitRanks(suit, hero).length > 0);
    const fdSuit = level === 'flush' || level === 'straight_flush'
        ? undefined
        : heroSuits.find(suit => all.filter(card => card.color === suit).length === 4);
    const fdRank = fdSuit ? rankPosition(heroSuitRank(fdSuit), possibleInSuit(fdSuit)) : undefined;

    // Tirages quinte
    const hasStraight = level === 'straight' || level === 'straight_flush';
    const outs = hasStraight ? 0 : straightOuts(heroRanks, boardRanks);
    const oesd = outs >= 2;
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
                const topOuts = straightOuts(heroRanks, [boardFeatures.top, turn]);
                if (!oesd && !gutshot) {
                    bdsd.push({ twoCards: singleOuts === 0, throughTop: topOuts >= 1 });
                }
                if (!oesd && turnOuts >= 2) {
                    bdoesd.push({ twoCards: singleOuts < 2, throughTop: topOuts >= 2 });
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
        fd: !!fdSuit,
        fdRank,
        oesd,
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
