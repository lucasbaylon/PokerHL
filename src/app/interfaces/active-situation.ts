import { Action } from "./action";

export interface ActiveSituation {
    nbPlayer: number;

    dealer?: string;

    left_card?: string;

    right_card?: string;

    actions: Action[];

    result: string;
}
