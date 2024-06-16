import { Action } from "./action";
import { Card } from "./card";

export interface Situation {
    id?: number;

    name?: string;

    type:string;

    nbPlayer?: number;

    stack: number;

    position?: string;

    opponentLevel?: string;

    fishPosition?: string;

    actions: Action[];

    situations: Card[][];
}