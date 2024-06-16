import { Action } from "./action";

interface ColorCard {
    name: string;
    color: string;
}

interface Card {
    color: ColorCard;
    value: string;
}

export interface ActiveSituation {
    nbPlayer: number;

    position?: string;

    left_card: Card;

    right_card: Card;

    actions: Action[];

    result: string;

    dealerMissingTokens?: number;

    opponentLevel?: string;

    fishPosition?: string;
}
