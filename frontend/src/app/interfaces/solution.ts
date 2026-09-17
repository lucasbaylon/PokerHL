export type SolutionAction = 'fold' | 'check' | 'call' | 'limp' | 'raise' | 'all-in';

export interface Solution {
    id: string;

    type: string;

    display_name: string | undefined;

    action?: SolutionAction;

    raiseAmount?: number;

    color?: string;

    colorList?: {color: string, percent?: number}[];
}
