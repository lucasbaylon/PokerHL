import { Card } from "./card";
import { Solution } from "./solution";

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

    solutions: Solution[];

    situations: Card[][];
}