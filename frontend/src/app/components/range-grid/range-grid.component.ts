import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Card } from '../../interfaces/card';
import { Solution } from '../../interfaces/solution';
import { SolutionColorPipe } from '../../pipes/solution-color.pipe';
import { CommonService } from '../../services/common.service';

@Component({
    selector: 'app-range-grid',
    standalone: true,
    imports: [NgClass],
    templateUrl: './range-grid.component.html'
})
export class RangeGridComponent {
    @Input() situations: Card[][] = [];
    @Input() solutions: Solution[] = [];
    @Input() editable: boolean = false;
    @Input() selectedSolutionId?: string;
    @Input() highlightedCard?: string;
    @Input() size: 'default' | 'md' | 'custom' = 'default';
    @Input() cellWidth?: number;
    @Input() cellHeight?: number;
    @Input() fontSize?: number;
    @Input() animateRows: boolean = false;
    @Input() tableClass: string = '';
    @Input() cellClass: string = '';
    @Input() customBackgroundFn?: (rowIndex: number, colIndex: number, card: Card, context?: unknown) => string;
    @Input() customBackgroundContext?: unknown;

    @Output() rangeChange = new EventEmitter<Card[][]>();
    @Output() cellClick = new EventEmitter<{ rowIndex: number; colIndex: number; card: Card; event: MouseEvent }>();

    private isSelectionActive: boolean = false;
    private readonly solutionColorPipe: SolutionColorPipe;

    constructor(private readonly commonService: CommonService) {
        this.solutionColorPipe = new SolutionColorPipe(commonService);
    }

    getCellTextShadow(item: Card): string | null {
        if (!item.solution || !this.commonService.getRangeTextOutline()) {
            return null;
        }
        return '-0.5px -0.5px 0 #000, 0.5px -0.5px 0 #000, -0.5px 0.5px 0 #000, 0.5px 0.5px 0 #000';
    }

    get computedTableClass(): string {
        if (this.tableClass) {
            return this.tableClass;
        }
        if (this.editable) {
            return 'mx-auto table-fixed border-separate border-spacing-1';
        }
        if (this.size === 'md') {
            return 'mx-auto border-separate border-spacing-1';
        }
        if (this.cellWidth || this.cellHeight) {
            return 'border-separate border-spacing-1 select-none';
        }
        return 'mx-auto border-separate border-spacing-1';
    }

    getCellClass(item: Card): string {
        if (this.cellClass) {
            return this.cellClass;
        }
        if (this.editable) {
            return `rounded cursor-pointer ${this.getTextSizeClass(true)} font-semibold select-none text-center align-middle p-2 py-3 bg-white dark:text-white hover:bg-gray-300 dark:bg-secondary-dark-bg dark:hover:bg-gray-600 shadow-xl`;
        }
        if (this.size === 'md') {
            return `h-10 w-10 select-none rounded text-center align-middle ${this.getTextSizeClass(false)} font-semibold text-white shadow-sm`;
        }
        if (this.cellWidth || this.cellHeight) {
            return 'relative cursor-default overflow-hidden rounded text-center align-middle font-semibold text-white shadow';
        }
        return `h-10 w-10 select-none rounded text-center align-middle ${this.getTextSizeClass(false)} font-semibold text-white shadow-sm`;
    }

    getCustomFontSize(): number | undefined {
        if (!this.fontSize) {
            return undefined;
        }
        const offset = { small: 0, medium: 1, large: 3 }[this.commonService.getRangeFontSize()];
        return this.fontSize + offset;
    }

    private getTextSizeClass(editable: boolean): string {
        const size = this.commonService.getRangeFontSize();
        if (editable) {
            return { small: 'text-base', medium: 'text-[17px]', large: 'text-xl' }[size];
        }
        return { small: 'text-sm', medium: 'text-[15px]', large: 'text-lg' }[size];
    }

    getCellDynamicClasses(item: Card): string {
        const highlightClasses = item.card === this.highlightedCard
            ? 'relative z-10 scale-110 outline outline-4 outline-offset-2 outline-amber-400'
            : '';
        if (this.editable) {
            return `${item.solution ? 'text-white dark:text-gray-300' : 'text-gray-800'} ${highlightClasses}`;
        }
        return highlightClasses;
    }

    getCellBackground(rowIndex: number, colIndex: number, item: Card): string {
        if (this.customBackgroundFn) {
            return this.customBackgroundFn(rowIndex, colIndex, item, this.customBackgroundContext);
        }
        if (!item?.solution) {
            return '';
        }
        return this.solutionColorPipe.transform(item.solution, this.solutions);
    }

    onMouseDown(rowIndex: number, colIndex: number, event: MouseEvent): void {
        if (!this.editable) {
            this.cellClick.emit({ rowIndex, colIndex, card: this.situations[rowIndex]?.[colIndex], event });
            return;
        }
        if (event.button === 0) {
            this.isSelectionActive = true;
            this.applySolution(rowIndex, colIndex, false);
        } else if (event.button === 2) {
            this.applySolution(rowIndex, colIndex, true);
        }
    }

    onMouseEnter(rowIndex: number, colIndex: number, event: MouseEvent): void {
        if (!this.editable || !this.isSelectionActive) {
            return;
        }
        if (event.button === 0 || event.buttons === 1) {
            this.applySolution(rowIndex, colIndex, false);
        } else if (event.button === 2 || event.buttons === 2) {
            this.applySolution(rowIndex, colIndex, true);
        }
    }

    onMouseUp(event: MouseEvent): void {
        if (!this.editable) {
            return;
        }
        if (event.button === 0) {
            this.isSelectionActive = false;
        }
    }

    onMouseLeave(): void {
        if (!this.editable) {
            return;
        }
        this.isSelectionActive = false;
    }

    private applySolution(rowIndex: number, colIndex: number, fillToEnd: boolean): void {
        if (!this.situations?.[rowIndex]) {
            return;
        }
        if (fillToEnd) {
            for (let i = colIndex; i < this.situations[rowIndex].length; i++) {
                this.situations[rowIndex][i].solution = this.selectedSolutionId;
            }
        } else {
            if (this.situations[rowIndex][colIndex]) {
                this.situations[rowIndex][colIndex].solution = this.selectedSolutionId;
            }
        }
        this.rangeChange.emit(this.situations);
    }
}
