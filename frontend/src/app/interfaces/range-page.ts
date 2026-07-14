import { Situation } from './situation';

export type RangeBlockType = 'range' | 'text' | 'filter';
export type RangeBlockSource = 'situation' | 'custom';
export type RangeFilterTarget = 'page' | 'global' | 'both';

export interface RangePageFilters {
    name?: string;
    type?: string;
    position?: string;
    opponentLevel?: string;
    stack?: number;
}

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
    filterTarget?: RangeFilterTarget;
    filters?: RangePageFilters;
    source?: RangeBlockSource;
    situationId?: number;
    customRange?: Situation;
    trainable?: boolean;
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
