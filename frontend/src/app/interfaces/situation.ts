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

    solutions: Solution[];

    situations: Card[][];
}