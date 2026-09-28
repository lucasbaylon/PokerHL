export type SolutionAction = 'fold' | 'check' | 'call' | 'limp' | 'raise' | 'bet' | 'all-in';

export interface Solution {
    id: string;

    type: string;

    display_name: string | undefined;

    action?: SolutionAction;

    raiseAmount?: number;

    betPercent?: number;

    /** Raise au flop face à une mise : multiple de la mise adverse. */
    raiseMultiplier?: number;

    color?: string;

    colorList?: {color: string, percent?: number}[];
}
