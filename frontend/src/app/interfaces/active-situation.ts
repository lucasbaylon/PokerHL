import { Action } from "./action";

export interface ActiveSituation {
    nbPlayer: number;

    position?: string;

    left_card?: string;

    right_card?: string;

    actions: Action[];

    result: string;

    dealerMissingTokens?: number;

    opponentLevel?: string;

    fishPosition?: string;
}
