import { FlopRule } from "../services/flop-rules";
import { HandFeatures } from "../services/hand-evaluator";
import { ActionLineStep, HeroSpot } from "./situation";
import { Solution } from "./solution";

export interface TableColorCardObj {
    name: string;
    color: string;
}

export interface TableColorCard {
    color: TableColorCardObj;
    value: string;
}

export interface TableCard {
    leftCard: TableColorCard;
    rightCard: TableColorCard;
}

export interface ActiveSituation {
    type: string;

    nbPlayer: number;

    position?: string;

    leftCard: TableColorCard;

    rightCard: TableColorCard;

    solutions: Solution[];

    result: string[];

    stack?: number;

    opponentLevel?: string;

    fishPosition?: string;

    previousPlayer1Action?: string;

    previousPlayer2Action?: string;

    board?: TableColorCard[];

    pot?: number;

    flopTypes?: string[];

    heroSpot?: HeroSpot;

    facingBetPercent?: number;

    /** Actions jouées avant la situation, affichées au héros. */
    actionLine?: ActionLineStep[];

    /** Analyse de la main sur le board et règle qui a donné la réponse (-1 : action par défaut). */
    hand?: HandFeatures;

    rule?: FlopRule;
}
