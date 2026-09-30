import { FlopRule, RuleCondition } from "../services/flop-rules";
import { BoardSuitsFilter, FlopType } from "../services/flop.service";
import { Card } from "./card";
import { Solution } from "./solution";

/** Situation du héros postflop : premier à parler (ou checké) ou face à une mise adverse. */
export type HeroSpot = 'first' | 'facingBet';

/** Types de situation joués après le flop (board tiré, range et règles d'action). */
export const POSTFLOP_TYPES = ['flop', 'turn', 'river'];

/**
 * Indique si un type de situation se joue après le flop.
 * @param type Type de situation.
 */
export function isPostflop(type: string | undefined): boolean {
    return POSTFLOP_TYPES.includes(type ?? '');
}

/** Street d'une action de la ligne d'action (streets précédant celle de la situation). */
export type ActionLineStreet = 'preflop' | 'flop' | 'turn';

export type ActionLineAction = 'limp' | 'raise' | 'check' | 'bet' | 'call';

/** Action jouée avant la situation, affichée au héros pour décrire le coup. */
export interface ActionLineStep {
    street: ActionLineStreet;
    /** villain : adversaire 1 (siège de gauche à 3 joueurs, seul adversaire en HU) ; villain2 : adversaire 2 (siège de droite). */
    actor: 'hero' | 'villain' | 'villain2';
    action: ActionLineAction;
    /** Taille : % du pot pour un bet, multiplicateur pour un raise. */
    size?: number;
}

export const ACTION_LINE_STREETS: { code: ActionLineStreet, name: string }[] = [
    { code: 'preflop', name: 'Préflop' }, { code: 'flop', name: 'Flop' }, { code: 'turn', name: 'Turn' }
];

export const ACTION_LINE_ACTIONS: { code: ActionLineAction, name: string }[] = [
    { code: 'limp', name: 'Limp' }, { code: 'raise', name: 'Raise' }, { code: 'check', name: 'Check' },
    { code: 'bet', name: 'Bet' }, { code: 'call', name: 'Call' }
];

/**
 * Ligne d'action regroupée par street, chaque action avec son acteur (ex. Flop : [héros, « bet 75 % »], [adversaire, « call »]).
 * @param line Actions précédant la situation.
 */
export function actionLineByStreet(line: ActionLineStep[] | undefined): { street: string, steps: { actor: ActionLineStep['actor'], text: string }[] }[] {
    return ACTION_LINE_STREETS
        .map(street => ({
            street: street.name,
            steps: (line ?? []).filter(step => step.street === street.code).map(step => {
                const action = ACTION_LINE_ACTIONS.find(item => item.code === step.action)?.name.toLowerCase() ?? step.action;
                const size = step.size == null ? '' : step.action === 'bet' ? ` ${step.size} %` : step.action === 'raise' ? ` x${step.size}` : '';
                return { actor: step.actor, text: `${action}${size}` };
            })
        }))
        .filter(item => item.steps.length);
}

/**
 * Nom d'un acteur de la ligne d'action ; les adversaires ne sont numérotés que s'il y en a deux.
 * @param actor Acteur de l'action.
 * @param numbered Numéroter les adversaires (situation à 3 joueurs).
 */
export function actionLineActorName(actor: ActionLineStep['actor'], numbered: boolean): string {
    if (actor === 'hero') return 'Héros';
    return numbered ? `Adversaire ${actor === 'villain2' ? 2 : 1}` : 'Adversaire';
}

/**
 * Ligne d'action lisible, regroupée par street (ex. « Flop : Héros bet 75 % · Adversaire call »).
 * @param line Actions précédant la situation.
 * @param nbPlayer Nombre de joueurs : à 3, les adversaires sont numérotés.
 */
export function describeActionLine(line: ActionLineStep[] | undefined, nbPlayer?: number): { street: string, text: string }[] {
    return actionLineByStreet(line).map(item => ({
        street: item.street,
        text: item.steps.map(step => `${actionLineActorName(step.actor, nbPlayer === 3)} ${step.text}`).join(' · ')
    }));
}

/** Valeur des cases de la range d'une situation flop. */
export const IN_RANGE = 'in_range';

export interface Situation {
    id?: number;

    name?: string;

    type:string;

    nbPlayer?: number;

    stack: number;

    position?: string;

    opponentLevel?: string;

    fishPosition?: string;

    previousPlayer1Action?: string;

    previousPlayer2Action?: string;

    /** Ancien champ (un seul type de flop), migré vers flopTypes au chargement. */
    flopType?: FlopType;

    flopTypes?: FlopType[];

    boardSuits?: BoardSuitsFilter;

    boardConditions?: RuleCondition[];

    heroSpot?: HeroSpot;

    facingBetPercent?: number;

    pot?: number;

    /** Conditions sur le board après la turn (situations turn et river). */
    turnConditions?: RuleCondition[];

    /** Conditions sur le board après la river (situations river). */
    riverConditions?: RuleCondition[];

    /** Actions jouées avant la situation (situations postflop). */
    actionLine?: ActionLineStep[];

    rules?: FlopRule[];

    defaultSolutionId?: string;

    solutions: Solution[];

    situations: Card[][];
}