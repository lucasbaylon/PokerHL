import { Situation } from './situation';

export type RangeBlockType = 'range' | 'text' | 'positions';
export type RangeBlockSource = 'situation' | 'custom';

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
