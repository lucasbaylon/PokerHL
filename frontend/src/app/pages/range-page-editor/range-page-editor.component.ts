import { NgClass, NgStyle } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { cloneDeep } from 'lodash';
import { InputTextModule } from 'primeng/inputtext';
import { Subscription } from 'rxjs';
import { RangePage, RangePageBlock, RangePageFilters } from '../../interfaces/range-page';
import { Situation } from '../../interfaces/situation';
import { Solution } from '../../interfaces/solution';
import { SolutionColorPipe } from '../../pipes/solution-color.pipe';
import { CommonService } from '../../services/common.service';
import { RangePageService } from '../../services/range-page.service';
import { SituationService } from '../../services/situation.service';

type DragMode = 'move' | 'resize';

@Component({
    selector: 'app-range-page-editor',
    standalone: true,
    imports: [FormsModule, NgStyle, NgClass, SolutionColorPipe, InputTextModule],
    templateUrl: './range-page-editor.component.html'
})
export class RangePageEditorComponent implements OnInit, OnDestroy {

    private rangePageSubscription!: Subscription;
    private situationsSubscription!: Subscription;
    private autoSaveTimeout?: ReturnType<typeof setTimeout>;
    private dragState?: {
        blockId: string;
        mode: DragMode;
        startX: number;
        startY: number;
        originalX: number;
        originalY: number;
        originalW: number;
        originalH: number;
    };

    page: RangePage = this.createEmptyPage();
    situations: Situation[] = [];
    selectedBlockId?: string;
    selectedSituationId?: number;
    pageFilter: RangePageFilters = {};
    globalFilter: RangePageFilters = {};
    activeSolutionId = 'unique_solution_0';
    isPainting = false;
    mode: 'new' | 'edit' = 'new';
    saveStatus = 'Enregistré';

    readonly gridSize = 24;
    readonly canvasWidth = 2400;
    readonly canvasHeight = 1440;
    readonly minBlockWidth = this.gridSize * 10;
    readonly minBlockHeight = this.gridSize * 8;

    availableTypes = [
        { name: 'Tous', code: '' },
        { name: 'Préflop', code: 'preflop' },
        { name: 'Flop', code: 'flop' }
    ];

    availablePositions = [
        { name: 'Toutes', code: '' },
        { name: 'SB', code: 'sb' },
        { name: 'BB', code: 'bb' },
        { name: 'BU', code: 'bu' }
    ];

    availableOpponentLevels = [
        { name: 'Tous', code: '' },
        { name: 'Fish', code: 'fish' },
        { name: 'Reg', code: 'shark' },
        { name: 'Mixte', code: 'fish_shark' }
    ];

    availablePreviousActions = [
        'Fold',
        'Limp',
        'Call',
        'Raise 2BB',
        'Raise 2.5BB',
        'All In'
    ];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private rangePageService: RangePageService,
        private situationService: SituationService,
        public commonService: CommonService
    ) { }

    ngOnInit(): void {
        this.situationsSubscription = this.situationService.situations.subscribe((data: Situation[]) => {
            this.situations = data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        });
        this.situationService.getSituations();

        this.rangePageSubscription = this.rangePageService.rangePage.subscribe((rangePageStr: string) => {
            this.page = JSON.parse(rangePageStr) as RangePage;
            this.mode = 'edit';
            this.normalizePage();
        });

        const pageId = this.route.snapshot.params['page_id'];
        if (pageId) {
            this.rangePageService.getRangePage(pageId);
        }

        window.addEventListener('mousemove', this.onWindowMouseMove);
        window.addEventListener('mouseup', this.onWindowMouseUp);
    }

    ngOnDestroy(): void {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        this.rangePageSubscription.unsubscribe();
        this.situationsSubscription.unsubscribe();
        window.removeEventListener('mousemove', this.onWindowMouseMove);
        window.removeEventListener('mouseup', this.onWindowMouseUp);
    }

    createEmptyPage(): RangePage {
        return {
            name: 'Nouvelle page',
            blocks: [],
            displaySettings: {
                cellSize: 34,
                compact: false,
                showLegend: true
            }
        };
    }

    normalizePage() {
        if (!this.page.displaySettings) {
            this.page.displaySettings = { cellSize: 34, compact: false, showLegend: true };
        }

        this.page.blocks = (this.page.blocks || []).map(block => this.normalizeBlock(block));
    }

    normalizeBlock(block: RangePageBlock): RangePageBlock {
        const normalizedBlock = { ...block };
        const minSize = this.minSizeForBlock(normalizedBlock);

        normalizedBlock.x = this.snapToGrid(normalizedBlock.x || 0, 0, this.canvasWidth - minSize.width);
        normalizedBlock.y = this.snapToGrid(normalizedBlock.y || 0, 0, this.canvasHeight - minSize.height);
        normalizedBlock.w = this.snapToGrid(normalizedBlock.w || minSize.width, minSize.width, this.canvasWidth - normalizedBlock.x);
        normalizedBlock.h = this.snapToGrid(normalizedBlock.h || minSize.height, minSize.height, this.canvasHeight - normalizedBlock.y);
        normalizedBlock.zIndex = normalizedBlock.zIndex || this.nextZIndex();

        if (normalizedBlock.type === 'filter' && !normalizedBlock.filters) {
            normalizedBlock.filters = {};
        }

        if (normalizedBlock.type === 'range') {
            normalizedBlock.cellSize = normalizedBlock.cellSize || this.page.displaySettings.cellSize;
            normalizedBlock.compact = normalizedBlock.compact ?? this.page.displaySettings.compact;
            normalizedBlock.showLegend = normalizedBlock.showLegend ?? this.page.displaySettings.showLegend;
            const rangeMinSize = this.minSizeForBlock(normalizedBlock);
            normalizedBlock.w = Math.max(normalizedBlock.w, rangeMinSize.width);
            normalizedBlock.h = Math.max(normalizedBlock.h, rangeMinSize.height);
        }

        return normalizedBlock;
    }

    addRangeBlock(source: 'situation' | 'custom') {
        if (source === 'situation' && this.selectedSituationId === undefined) {
            this.commonService.showSwalToast('Veuillez sélectionner une situation.', 'error');
            return;
        }

        const baseRange = cloneDeep(this.commonService.empty_situation_obj);
        baseRange.name = 'Range personnalisée';
        const selectedSituation = this.situations.find(situation => situation.id === this.selectedSituationId);

        const position = this.nextBlockPosition();
        const block: RangePageBlock = {
            id: this.createBlockId(),
            type: 'range',
            title: source === 'situation' ? selectedSituation?.name : 'Range personnalisée',
            source,
            situationId: source === 'situation' ? this.selectedSituationId : undefined,
            customRange: source === 'custom' ? baseRange : undefined,
            trainable: false,
            x: position.x,
            y: position.y,
            w: this.gridSize * 24,
            h: this.gridSize * 24,
            zIndex: this.nextZIndex(),
            cellSize: this.page.displaySettings.cellSize,
            compact: this.page.displaySettings.compact,
            showLegend: this.page.displaySettings.showLegend
        };

        this.page.blocks.push(this.normalizeBlock(block));
        this.selectedBlockId = block.id;
        this.scheduleAutoSave();
    }

    addTextBlock() {
        const position = this.nextBlockPosition();
        const block: RangePageBlock = {
            id: this.createBlockId(),
            type: 'text',
            title: 'Note',
            text: 'Nouvelle note',
            x: position.x,
            y: position.y,
            w: this.gridSize * 16,
            h: this.gridSize * 10,
            zIndex: this.nextZIndex()
        };

        this.page.blocks.push(this.normalizeBlock(block));
        this.selectedBlockId = block.id;
        this.scheduleAutoSave();
    }

    addFilterBlock() {
        const position = this.nextBlockPosition();
        const block: RangePageBlock = {
            id: this.createBlockId(),
            type: 'filter',
            title: 'Filtres',
            filterTarget: 'both',
            filters: {},
            x: position.x,
            y: position.y,
            w: this.gridSize * 18,
            h: this.gridSize * 12,
            zIndex: this.nextZIndex()
        };

        this.page.blocks.push(this.normalizeBlock(block));
        this.selectedBlockId = block.id;
        this.scheduleAutoSave();
    }

    autoSavePage() {
        if (!this.page.name.trim()) {
            this.saveStatus = 'Nom requis';
            return;
        }

        this.page.blocks = this.page.blocks.map(block => this.normalizeBlock(block));

        if (this.mode === 'edit') {
            this.rangePageService.editRangePage(this.page);
        } else {
            this.rangePageService.addRangePage(this.page);
        }
        this.saveStatus = 'Enregistré';
    }

    scheduleAutoSave() {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        this.saveStatus = 'Sauvegarde...';
        this.autoSaveTimeout = setTimeout(() => {
            this.autoSavePage();
        }, 600);
    }

    selectedBlock(): RangePageBlock | undefined {
        return this.page.blocks.find(block => block.id === this.selectedBlockId);
    }

    selectBlock(block: RangePageBlock) {
        this.selectedBlockId = block.id;
        block.zIndex = this.nextZIndex();
    }

    removeBlock(blockId: string) {
        this.page.blocks = this.page.blocks.filter(block => block.id !== blockId);
        if (this.selectedBlockId === blockId) {
            this.selectedBlockId = undefined;
        }
        this.scheduleAutoSave();
    }

    duplicateBlock(block: RangePageBlock) {
        const duplicatedBlock = cloneDeep(block);
        duplicatedBlock.id = this.createBlockId();
        duplicatedBlock.title = `${block.title || 'Bloc'} copie`;
        duplicatedBlock.x = this.snapToGrid(block.x + this.gridSize * 2, 0, this.canvasWidth - block.w);
        duplicatedBlock.y = this.snapToGrid(block.y + this.gridSize * 2, 0, this.canvasHeight - block.h);
        duplicatedBlock.zIndex = this.nextZIndex();

        this.page.blocks.push(this.normalizeBlock(duplicatedBlock));
        this.selectedBlockId = duplicatedBlock.id;
        this.scheduleAutoSave();
    }

    rangeForBlock(block: RangePageBlock): Situation | undefined {
        if (block.source === 'custom') return block.customRange;
        return this.situations.find(situation => situation.id === block.situationId);
    }

    startDrag(event: MouseEvent, block: RangePageBlock, mode: DragMode) {
        event.preventDefault();
        event.stopPropagation();
        this.selectBlock(block);
        this.dragState = {
            blockId: block.id,
            mode,
            startX: event.clientX,
            startY: event.clientY,
            originalX: block.x,
            originalY: block.y,
            originalW: block.w,
            originalH: block.h
        };
    }

    onWindowMouseMove = (event: MouseEvent) => {
        if (!this.dragState) return;

        const block = this.page.blocks.find(item => item.id === this.dragState?.blockId);
        if (!block) return;

        const deltaX = event.clientX - this.dragState.startX;
        const deltaY = event.clientY - this.dragState.startY;

        if (this.dragState.mode === 'move') {
            block.x = this.snapToGrid(this.dragState.originalX + deltaX, 0, this.canvasWidth - block.w);
            block.y = this.snapToGrid(this.dragState.originalY + deltaY, 0, this.canvasHeight - block.h);
        } else {
            const minSize = this.minSizeForBlock(block);
            block.w = this.snapToGrid(this.dragState.originalW + deltaX, minSize.width, this.canvasWidth - block.x);
            block.h = this.snapToGrid(this.dragState.originalH + deltaY, minSize.height, this.canvasHeight - block.y);
        }
    };

    onWindowMouseUp = () => {
        const shouldAutoSave = this.dragState !== undefined || this.isPainting;
        this.dragState = undefined;
        this.isPainting = false;
        if (shouldAutoSave) {
            this.scheduleAutoSave();
        }
    };

    applyFiltersFromBlock(block: RangePageBlock) {
        if (!block.filters) block.filters = {};
        if (block.filterTarget === 'page' || block.filterTarget === 'both') {
            this.pageFilter = { ...block.filters };
        }
        if (block.filterTarget === 'global' || block.filterTarget === 'both') {
            this.globalFilter = { ...block.filters };
        }
        this.scheduleAutoSave();
    }

    clearFilters() {
        this.pageFilter = {};
        this.globalFilter = {};
        this.scheduleAutoSave();
    }

    visibleBlocks(): RangePageBlock[] {
        return this.page.blocks.filter(block => {
            if (block.type !== 'range') return true;
            const range = this.rangeForBlock(block);
            return this.matchFilters(range, this.pageFilter);
        });
    }

    filteredSituations(): Situation[] {
        return this.situations.filter(situation => this.matchFilters(situation, this.globalFilter));
    }

    matchFilters(situation: Situation | undefined, filters: RangePageFilters): boolean {
        if (!situation) return true;
        if (filters.name && !(situation.name || '').toLowerCase().includes(filters.name.toLowerCase())) return false;
        if (filters.type && situation.type !== filters.type) return false;
        if (filters.position && situation.position !== filters.position) return false;
        if (filters.opponentLevel && situation.opponentLevel !== filters.opponentLevel) return false;
        if (filters.stack !== undefined && filters.stack !== null && situation.stack !== filters.stack) return false;
        return true;
    }

    paintCell(block: RangePageBlock, rowIndex: number, cellIndex: number) {
        if (block.source !== 'custom' || !block.customRange) return;
        block.customRange.situations[rowIndex][cellIndex].solution = this.activeSolutionId;
        this.scheduleAutoSave();
    }

    startPainting(block: RangePageBlock, rowIndex: number, cellIndex: number) {
        this.isPainting = true;
        this.paintCell(block, rowIndex, cellIndex);
    }

    updatePainting(block: RangePageBlock, rowIndex: number, cellIndex: number) {
        if (!this.isPainting) return;
        this.paintCell(block, rowIndex, cellIndex);
    }

    addUniqueSolution(block: RangePageBlock) {
        if (!block.customRange) return;
        const solutionCount = block.customRange.solutions.filter(solution => solution.type === 'unique').length;
        if (solutionCount >= 7) return;
        block.customRange.solutions.push({
            id: `unique_solution_${solutionCount}`,
            type: 'unique',
            display_name: 'Action',
            color: this.getNextColor(block.customRange.solutions)
        });
        this.scheduleAutoSave();
    }

    updateSolutionName(solution: Solution, value: string) {
        solution.display_name = value;
        this.scheduleAutoSave();
    }

    updateSolutionColor(solution: Solution, value: string) {
        solution.color = value;
        this.scheduleAutoSave();
    }

    saveCustomRangeAsSituation(block: RangePageBlock) {
        if (!block.customRange) return;

        const hasEmptyCell = block.customRange.situations.some(row => row.some(cell => cell.solution === undefined));
        if (hasEmptyCell) {
            this.commonService.showSwalToast('Veuillez remplir toute la range avant de l’envoyer dans les situations.', 'error');
            return;
        }

        this.situationService.addSituation(block.customRange);
        block.trainable = true;
        this.commonService.showSwalToast('Range envoyée dans les situations !');
        this.scheduleAutoSave();
    }

    goBack() {
        this.router.navigate(['range-pages']);
    }

    blockStyle(block: RangePageBlock) {
        return {
            left: `${block.x}px`,
            top: `${block.y}px`,
            width: `${block.w}px`,
            'min-height': `${block.h}px`,
            'z-index': block.zIndex
        };
    }

    canvasGridStyle() {
        return {
            'background-size': `${this.gridSize}px ${this.gridSize}px`,
            'background-image': 'linear-gradient(to right, rgba(120,120,120,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,120,120,0.18) 1px, transparent 1px)'
        };
    }

    cellSize(block: RangePageBlock): number {
        return block.cellSize || this.page.displaySettings.cellSize;
    }

    isSelected(block: RangePageBlock): boolean {
        return this.selectedBlockId === block.id;
    }

    minSizeForBlock(block: RangePageBlock) {
        if (block.type === 'range') {
            const cellSize = block.cellSize || this.page.displaySettings.cellSize;
            const gridWidth = Math.ceil((cellSize + 4) * 13 + 32);
            const gridHeight = Math.ceil(((block.compact ? cellSize - 8 : cellSize) + 4) * 13 + 96 + (block.showLegend ? 44 : 0));
            return {
                width: this.snapToGrid(gridWidth, this.minBlockWidth, this.canvasWidth),
                height: this.snapToGrid(gridHeight, this.minBlockHeight, this.canvasHeight)
            };
        }

        if (block.type === 'filter') {
            return {
                width: this.gridSize * 18,
                height: this.gridSize * 10
            };
        }

        return {
            width: this.minBlockWidth,
            height: this.minBlockHeight
        };
    }

    createBlockId(): string {
        return `block_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    }

    nextZIndex(): number {
        return Math.max(0, ...this.page.blocks.map(block => block.zIndex || 0)) + 1;
    }

    nextBlockPosition() {
        const offset = this.snapToGrid(this.page.blocks.length * this.gridSize * 2, 0, this.gridSize * 16);
        return {
            x: this.gridSize * 2 + offset,
            y: this.gridSize * 2 + offset
        };
    }

    snapToGrid(value: number, min: number, max: number): number {
        const snappedValue = Math.round(value / this.gridSize) * this.gridSize;
        return Math.max(min, Math.min(max, snappedValue));
    }

    getNextColor(solutions: Solution[]): string {
        const colors = ['#d80c05', '#ff9100', '#7a5a00', '#3f7a89', '#96c582', '#303030', '#1c51ff', '#00aeff', '#8350ff', '#e284ff'];
        const usedColors = solutions.map(solution => solution.color);
        return colors.find(color => !usedColors.includes(color)) || '#303030';
    }
}
