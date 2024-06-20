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
    nbPlayer: number;

    position?: string;

    leftCard: TableColorCard;

    rightCard: TableColorCard;

    solutions: Solution[];

    result: string[];

    stack?: number;

    opponentLevel?: string;

    fishPosition?: string;
}
