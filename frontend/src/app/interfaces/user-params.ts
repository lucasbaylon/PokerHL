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

    showParticules: boolean;

    particleCount?: number;

    particleSize?: number;

    particleSpeed?: number;

    particleLinks?: boolean;
}
