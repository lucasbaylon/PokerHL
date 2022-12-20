import { Action } from "./action";
import { Card } from "./card";

export interface Situation {
    name?: string;

    nbPlayer?: number;

    dealerMissingTokens?: number;

    dealer?: string | undefined;

    actions: Action[];

    situations: Card[][]
}
