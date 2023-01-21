import { Action } from "./action";
import { Card } from "./card";

export interface Situation {
    _id?: string;
    
    name?: string;

    nbPlayer?: number;

    dealerMissingTokens: number;

    dealer?: string;

    opponentLevel?: string;

    actions: Action[];

    situations: Card[][];
}
