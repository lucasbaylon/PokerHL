import { SolutionAction } from './solution';

export type ActionColors = Record<SolutionAction, string>;

export const DEFAULT_ACTION_COLORS: ActionColors = {
    'fold': '#3f7a89',
    'check': '#96c582',
    'call': '#00aeff',
    'limp': '#8350ff',
    'raise': '#ff9100',
    'bet': '#e8b100',
    'all-in': '#d80c05',
};

export interface ParticleSettings {
    particleCount: number;

    particleSize: number;

    particleSpeed: number;

    particleLinks: boolean;
}

export const DEFAULT_PARTICLE_SETTINGS: ParticleSettings = {
    particleCount: 30,
    particleSize: 4,
    particleSpeed: 0.4,
    particleLinks: true,
};

export interface UserParams {
    cardStyle: string;

    playmatColor: "green" | "red" | "blue";

    displaySolution: boolean;

    nextSituationOnError?: boolean;

    displaySituation: boolean;

    autoMultipleSolutionName: boolean;

    rangeTextOutline?: boolean;

    rangeFontSize?: 'small' | 'medium' | 'large';

    actionColors?: Partial<ActionColors>;

    showParticules: boolean;

    particleCount?: number;

    particleSize?: number;

    particleSpeed?: number;

    particleLinks?: boolean;
}
