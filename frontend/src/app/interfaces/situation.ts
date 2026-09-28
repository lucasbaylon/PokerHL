import { FlopRule, RuleCondition } from "../services/flop-rules";
import { BoardSuitsFilter, FlopType } from "../services/flop.service";
import { Card } from "./card";
import { Solution } from "./solution";

/** Situation du héros au flop : premier à parler (ou checké) ou face à une mise adverse. */
export type HeroSpot = 'first' | 'facingBet';

/** Valeur des cases de la range d'une situation flop. */
export const IN_RANGE = 'in_range';

export interface Situation {
    id?: number;

    name?: string;

    type:string;

    nbPlayer?: number;

    stack: number;

    position?: string;

    opponentLevel?: string;

    fishPosition?: string;

    previousPlayer1Action?: string;

    previousPlayer2Action?: string;

    /** Ancien champ (un seul type de flop), migré vers flopTypes au chargement. */
    flopType?: FlopType;

    flopTypes?: FlopType[];

    boardSuits?: BoardSuitsFilter;

    boardConditions?: RuleCondition[];

    heroSpot?: HeroSpot;

    facingBetPercent?: number;

    pot?: number;

    rules?: FlopRule[];

    defaultSolutionId?: string;

    solutions: Solution[];

    situations: Card[][];
}