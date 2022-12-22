import { Action } from "./action";
import { Card } from "./card";

export interface Situation {
    _id?: string;
    
    name?: string;

    nbPlayer?: number;

    dealerMissingTokens?: number;

    dealer?: string;

    actions: Action[];

    situations: Card[][]
}
