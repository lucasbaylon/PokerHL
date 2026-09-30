import { Injectable } from '@angular/core';
import { BoardCondition, RuleCondition, matchBoardCondition } from './flop-rules';
import { CARD_VALUES, PlayingCard, SUITS, Suit, cardRank, evaluateBoard } from './hand-evaluator';

export type FlopType =
    'dry_2_high' | 'dry_1_high' | 'connected_high' | 'straight_high' | 'low' |
    'straight_low' | 'paired_low' | 'paired_high_low' | 'paired_high' | 'mono_2_high' | 'other';

export type FlopSuit = Suit;

export type FlopCard = PlayingCard;

export type BoardSuitsFilter = 'any' | 'rainbow' | 'twoTone' | 'mono';

/** Filtre des flops tirés pour une situation. */
export interface FlopFilter {
    flopTypes: FlopType[];
    boardSuits?: BoardSuitsFilter;
    boardConditions?: RuleCondition[];
}

/** Street postflop d'une situation. */
export type Street = 'flop' | 'turn' | 'river';

/** Filtre des boards tirés pour une situation : filtre du flop, puis conditions sur le board après la turn et après la river. */
export interface BoardFilter extends FlopFilter {
    turnConditions?: RuleCondition[];
    riverConditions?: RuleCondition[];
}

/** Nombre maximal de boards évalués pour compléter un flop avant d'abandonner (filtre sans board possible). */
const BOARD_BUDGET = 40000;

export interface FlopTypeInfo {
    code: FlopType;
    name: string;
    description: string;
    example: string;
}

export const FLOP_TYPES: FlopTypeInfo[] = [
    { code: 'dry_2_high', name: 'Dry Flop 2 High', description: "Flop sans quinte possible, au moins deux cartes hautes, aucune carte basse à 4 rangs ou moins d'une carte haute.", example: 'K♦ 9♠ 3♣' },
    { code: 'dry_1_high', name: 'Dry Flop 1 High', description: 'Flop sans quinte possible, une seule carte haute, aucune carte basse à 4 rangs ou moins de celle-ci.', example: 'Q♥ 7♠ 2♦' },
    { code: 'connected_high', name: 'Connected High Flop', description: 'Flop sans quinte possible où une carte haute et une carte basse sont à 4 rangs ou moins.', example: 'K♠ T♣ 8♥' },
    { code: 'straight_high', name: 'Straight High Flop', description: 'Flop où une quinte est possible, avec au moins une carte haute.', example: 'J♣ 7♦ 8♠' },
    { code: 'low', name: 'Low Flop', description: 'Flop sans quinte possible avec uniquement des cartes basses.', example: '8♦ 4♠ 2♣' },
    { code: 'straight_low', name: 'Straight Low Flop', description: 'Flop où une quinte est possible, avec uniquement des cartes basses.', example: '5♠ 4♣ 3♦' },
    { code: 'paired_low', name: 'Paired Low Flop', description: 'Flop pairé dont toutes les cartes sont basses.', example: '4♦ 4♠ 2♣' },
    { code: 'paired_high_low', name: 'Paired High Flop with Low Card', description: 'Flop avec une paire haute et une carte basse.', example: 'Q♠ Q♦ 5♣' },
    { code: 'paired_high', name: 'Paired High Flop', description: 'Flop pairé dont la carte seule est haute, ou brelan.', example: 'K♣ K♠ 9♦' },
    { code: 'mono_2_high', name: 'Mono Flop 2 High', description: 'Flop de trois cartes de la même couleur, dont au moins deux cartes hautes.', example: 'A♠ Q♠ 8♠' },
    { code: 'other', name: 'Autre', description: 'Flop monotone avec moins de deux cartes hautes.', example: '8♥ 5♥ 2♥' }
];

export { CARD_VALUES, cardRank };

/** Une carte est haute à partir du 9. */
const HIGH_CARD_RANK = 9;

/** Les 52 cartes du jeu. */
const DECK: FlopCard[] = CARD_VALUES.flatMap(value => SUITS.map(color => ({ value, color })));

/**
 * Copie mélangée d'une liste (Fisher-Yates).
 */
function shuffled<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

/**
 * Conditions de board seules d'une liste de conditions.
 */
function boardConditionsOf(conditions: RuleCondition[] | undefined): BoardCondition[] {
    return (conditions ?? []).filter((condition): condition is BoardCondition => condition.kind === 'board');
}

const sameCard = (a: FlopCard, b: FlopCard) => a.value === b.value && a.color === b.color;

/**
 * Classe un flop dans l'un des types de flop.
 * Les couleurs ne comptent que pour les flops monotones ; l'As compte aussi comme 1 pour la quinte possible (roue).
 * Sans quinte possible, un flop est connecté si une carte haute et une carte basse sont à 4 rangs ou moins
 * (les écarts entre deux cartes hautes ou entre deux cartes basses ne comptent pas).
 * @param cards Les trois cartes du flop.
 * @returns Code du type de flop.
 */
export function classifyFlop(cards: FlopCard[]): FlopType {
    const ranks = cards.map(card => cardRank(card.value)).sort((a, b) => b - a);
    const highCount = ranks.filter(rank => rank >= HIGH_CARD_RANK).length;
    const isHigh = (rank: number) => rank >= HIGH_CARD_RANK;

    if (cards.every(card => card.color === cards[0].color)) {
        return highCount >= 2 ? 'mono_2_high' : 'other';
    }

    const distinct = [...new Set(ranks)];
    // Brelan : classé avec les flops pairés hauts
    if (distinct.length === 1) return 'paired_high';
    if (distinct.length === 2) {
        const pairRank = ranks[0] === ranks[1] ? ranks[0] : ranks[1];
        const singleRank = ranks.find(rank => rank !== pairRank)!;
        if (!isHigh(pairRank) && !isHigh(singleRank)) return 'paired_low';
        if (isHigh(singleRank)) return 'paired_high';
        // Paire haute et carte seule basse, sauf 899, 8TT et 8JJ
        return singleRank === 8 && pairRank <= 11 ? 'paired_high' : 'paired_high_low';
    }

    // L'As peut aussi servir de 1 (quinte A-2-3-4-5)
    const rankSets = ranks.includes(14) ? [ranks, ranks.map(rank => rank === 14 ? 1 : rank)] : [ranks];
    const straightPossible = rankSets.some(set => Math.max(...set) - Math.min(...set) <= 4);
    if (straightPossible) return highCount === 0 ? 'straight_low' : 'straight_high';

    const highRanks = ranks.filter(isHigh);
    const lowRanks = ranks.filter(rank => !isHigh(rank));
    if (!highRanks.length) return 'low';
    if (highRanks.some(high => lowRanks.some(low => high - low <= 4))) return 'connected_high';
    return highRanks.length >= 2 ? 'dry_2_high' : 'dry_1_high';
}

/**
 * Nom d'affichage d'un type de flop.
 * @param code Code du type de flop.
 */
export function flopTypeName(code: string | undefined): string | undefined {
    return FLOP_TYPES.find(type => type.code === code)?.name;
}

@Injectable({
    providedIn: 'root'
})
export class FlopService {

    private buckets?: Map<FlopType, FlopCard[][]>;
    private poolCache = new Map<string, FlopCard[][]>();

    /**
     * Range les 22 100 flops possibles par type (calculé une seule fois).
     */
    private getBuckets(): Map<FlopType, FlopCard[][]> {
        if (!this.buckets) {
            const deck = DECK;
            this.buckets = new Map(FLOP_TYPES.map(type => [type.code, [] as FlopCard[][]]));
            for (let i = 0; i < deck.length; i++) {
                for (let j = i + 1; j < deck.length; j++) {
                    for (let k = j + 1; k < deck.length; k++) {
                        const flop = [deck[i], deck[j], deck[k]];
                        this.buckets.get(classifyFlop(flop))!.push(flop);
                    }
                }
            }
        }
        return this.buckets;
    }

    /**
     * Flops possibles pour un filtre : types choisis, couleurs du flop et conditions de board (mémorisé par filtre).
     * @param filter Filtre de la situation.
     */
    flopPool(filter: FlopFilter): FlopCard[][] {
        const key = JSON.stringify([filter.flopTypes, filter.boardSuits ?? 'any', filter.boardConditions ?? []]);
        let pool = this.poolCache.get(key);
        if (!pool) {
            const conditions = boardConditionsOf(filter.boardConditions);
            pool = filter.flopTypes.flatMap(type => this.getBuckets().get(type) ?? []).filter(flop => {
                const board = evaluateBoard(flop);
                if (filter.boardSuits && filter.boardSuits !== 'any' && board.suits !== filter.boardSuits) return false;
                return conditions.every(condition => matchBoardCondition(condition, board));
            });
            this.poolCache.set(key, pool);
        }
        return pool;
    }

    /**
     * Tire un flop aléatoire correspondant au filtre, sans les cartes exclues (cartes du héros).
     * @param filter Filtre de la situation, ou un type de flop seul.
     * @param excluded Cartes déjà distribuées.
     * @returns Les trois cartes du flop, triées de la plus haute à la plus basse, ou un tableau vide si aucun flop ne correspond.
     */
    randomFlop(filter: FlopFilter | FlopType, excluded: FlopCard[] = []): FlopCard[] {
        const pool = this.flopPool(typeof filter === 'string' ? { flopTypes: [filter] } : filter);
        const isExcluded = (card: FlopCard) => excluded.some(item => sameCard(item, card));
        const candidates = excluded.length ? pool.filter(flop => !flop.some(isExcluded)) : pool;
        if (!candidates.length) return [];
        const flop = candidates[Math.floor(Math.random() * candidates.length)];
        return [...flop].sort((a, b) => cardRank(b.value) - cardRank(a.value));
    }

    /**
     * Tire un board complet pour une street : un flop correspondant au filtre, puis une turn et une river
     * vérifiant les conditions de leur street. Le flop est trié de la plus haute à la plus basse carte, suivi de la turn puis de la river.
     * @param filter Filtre de la situation.
     * @param street Street de la situation.
     * @param excluded Cartes déjà distribuées.
     * @param budget Nombre maximal de boards évalués avant d'abandonner.
     * @returns Les cartes du board, ou un tableau vide si aucun board ne correspond.
     */
    randomBoard(filter: BoardFilter, street: Street, excluded: FlopCard[] = [], budget: number = BOARD_BUDGET): FlopCard[] {
        if (street === 'flop') return this.randomFlop(filter, excluded);
        const turnConditions = boardConditionsOf(filter.turnConditions);
        const riverConditions = street === 'river' ? boardConditionsOf(filter.riverConditions) : [];
        const matches = (conditions: BoardCondition[], board: FlopCard[]) => {
            budget--;
            if (!conditions.length) return true;
            const features = evaluateBoard(board);
            return conditions.every(condition => matchBoardCondition(condition, features));
        };
        while (budget > 0) {
            const flop = this.randomFlop(filter, excluded);
            if (!flop.length) return [];
            const remaining = DECK.filter(card => ![...flop, ...excluded].some(used => sameCard(used, card)));
            for (const turn of shuffled(remaining)) {
                if (budget <= 0) break;
                if (!matches(turnConditions, [...flop, turn])) continue;
                if (street === 'turn') return [...flop, turn];
                for (const river of shuffled(remaining.filter(card => !sameCard(card, turn)))) {
                    if (budget <= 0) break;
                    if (matches(riverConditions, [...flop, turn, river])) return [...flop, turn, river];
                }
            }
        }
        return [];
    }

    /**
     * Tire une main dans une range, pondérée par le nombre de combinaisons (paire 6, assortie 4, dépareillée 12).
     * @param hands Mains de la range ('AA', 'AKs', 'AKo').
     * @returns Les deux cartes du héros, ou un tableau vide si la range est vide.
     */
    randomHeroHand(hands: string[]): FlopCard[] {
        const combos = (hand: string) => hand.length === 2 ? 6 : hand.endsWith('s') ? 4 : 12;
        const total = hands.reduce((sum, hand) => sum + combos(hand), 0);
        if (!total) return [];
        let pick = Math.random() * total;
        const hand = hands.find(item => (pick -= combos(item)) < 0) ?? hands[hands.length - 1];
        const shuffled = [...SUITS].sort(() => Math.random() - 0.5);
        const suited = hand.endsWith('s');
        return [
            { value: hand[0], color: shuffled[0] },
            { value: hand[1], color: suited ? shuffled[0] : shuffled[1] }
        ];
    }

    /**
     * Nombre de flops possibles pour chaque type.
     */
    countByType(): Record<FlopType, number> {
        return Object.fromEntries([...this.getBuckets()].map(([type, flops]) => [type, flops.length])) as Record<FlopType, number>;
    }
}
