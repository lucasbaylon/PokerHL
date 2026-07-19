import { Situation } from './situation';

export type RangeBlockType = 'range' | 'text' | 'positions';
export type RangeBlockSource = 'situation';

export interface RangePageDisplaySettings {
    cellSize: number;
    compact: boolean;
    showLegend: boolean;
}

export interface RangePageBlock {
    id: string;
    type: RangeBlockType;
    x: number;
    y: number;
    w: number;
    h: number;
    zIndex: number;
    title?: string;
    text?: string;
    positions?: string[];
    selectedPosition?: string;
    linkedRangeBlockId?: string;
    positionSituationId?: number;
    positionReference?: Situation;
    source?: RangeBlockSource;
    situationId?: number;
    cellSize?: number;
    compact?: boolean;
    showLegend?: boolean;
}

export interface RangePage {
    id?: number;
    name: string;
    blocks: RangePageBlock[];
    displaySettings: RangePageDisplaySettings;
}
