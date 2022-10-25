import { Action } from "./action";
import { Card } from "./card";

export interface Situation {
    nbPlayer?: number;

    dealerMissingTokens?: number;

    dealer?: string | undefined;

    actions: Action[];

    situations: Card[][]
}
