import { NgClass, NgStyle } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { cloneDeep } from 'lodash';
import { Subscription } from 'rxjs';
import { RangePage, RangePageBlock, RangePageFilters } from '../../interfaces/range-page';
import { Situation } from '../../interfaces/situation';
import { Solution } from '../../interfaces/solution';
import { PositionPipe } from '../../pipes/position.pipe';
import { SolutionColorPipe } from '../../pipes/solution-color.pipe';
import { TypePipe } from '../../pipes/type.pipe';
import { CommonService } from '../../services/common.service';
import { RangePageService } from '../../services/range-page.service';
import { SituationService } from '../../services/situation.service';

type DragMode = 'move' | 'resize';

@Component({
    selector: 'app-range-page-editor',
    standalone: true,
    imports: [FormsModule, NgStyle, NgClass, SolutionColorPipe, TypePipe, PositionPipe],
    templateUrl: './range-page-editor.component.html'
})
export class RangePageEditorComponent implements OnInit, OnDestroy {

    private rangePageSubscription!: Subscription;
    private situationsSubscription!: Subscription;
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
    clipboard = '';
    pageFilter: RangePageFilters = {};
    globalFilter: RangePageFilters = {};
    activeSolutionId = 'unique_solution_0';
    isPainting = false;
    mode: 'new' | 'edit' = 'new';

    readonly canvasWidth = 1800;
    readonly canvasHeight = 1100;

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
        this.page.blocks = this.page.blocks || [];
    }

    addRangeBlock(source: 'situation' | 'custom') {
        if (source === 'situation' && this.selectedSituationId === undefined) {
            this.commonService.showSwalToast('Veuillez sélectionner une situation.', 'error');
            return;
        }

        const baseRange = cloneDeep(this.commonService.empty_situation_obj);
        baseRange.name = 'Range personnalisée';
        const block: RangePageBlock = {
            id: this.createBlockId(),
            type: 'range',
            title: source === 'situation' ? 'Situation' : 'Range personnalisée',
            source,
            situationId: source === 'situation' ? this.selectedSituationId : undefined,
            customRange: source === 'custom' ? baseRange : undefined,
            trainable: false,
            x: 40,
            y: 40,
            w: 560,
            h: 520,
            zIndex: this.nextZIndex(),
            cellSize: this.page.displaySettings.cellSize,
            compact: this.page.displaySettings.compact,
            showLegend: this.page.displaySettings.showLegend
        };

        this.page.blocks.push(block);
        this.selectedBlockId = block.id;
    }

    addTextBlock() {
        const block: RangePageBlock = {
            id: this.createBlockId(),
            type: 'text',
            title: 'Note',
            text: 'Nouvelle note',
            x: 80,
            y: 80,
            w: 360,
            h: 220,
            zIndex: this.nextZIndex()
        };
        this.page.blocks.push(block);
        this.selectedBlockId = block.id;
    }

    addFilterBlock() {
        const block: RangePageBlock = {
            id: this.createBlockId(),
            type: 'filter',
            title: 'Filtres',
            filterTarget: 'both',
            filters: {},
            x: 120,
            y: 120,
            w: 420,
            h: 250,
            zIndex: this.nextZIndex()
        };
        this.page.blocks.push(block);
        this.selectedBlockId = block.id;
    }

    savePage() {
        if (!this.page.name.trim()) {
            this.commonService.showSwalToast('Veuillez donner un nom à la page.', 'error');
            return;
        }

        if (this.mode === 'edit') {
            this.rangePageService.editRangePage(this.page);
        } else {
            this.rangePageService.addRangePage(this.page);
        }
        this.commonService.showSwalToast('Page enregistrée !');
    }

    removeSelectedBlock() {
        if (!this.selectedBlockId) return;
        this.page.blocks = this.page.blocks.filter(block => block.id !== this.selectedBlockId);
        this.selectedBlockId = undefined;
    }

    selectedBlock(): RangePageBlock | undefined {
        return this.page.blocks.find(block => block.id === this.selectedBlockId);
    }

    rangeForBlock(block: RangePageBlock): Situation | undefined {
        if (block.source === 'custom') return block.customRange;
        return this.situations.find(situation => situation.id === block.situationId);
    }

    selectBlock(block: RangePageBlock) {
        this.selectedBlockId = block.id;
        block.zIndex = this.nextZIndex();
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
            block.x = Math.max(0, Math.min(this.canvasWidth - block.w, this.dragState.originalX + deltaX));
            block.y = Math.max(0, Math.min(this.canvasHeight - block.h, this.dragState.originalY + deltaY));
        } else {
            block.w = Math.max(260, Math.min(this.canvasWidth - block.x, this.dragState.originalW + deltaX));
            block.h = Math.max(180, Math.min(this.canvasHeight - block.y, this.dragState.originalH + deltaY));
        }
    };

    onWindowMouseUp = () => {
        this.dragState = undefined;
        this.isPainting = false;
    };

    applyFiltersFromBlock(block: RangePageBlock) {
        if (!block.filters) block.filters = {};
        if (block.filterTarget === 'page' || block.filterTarget === 'both') {
            this.pageFilter = { ...block.filters };
        }
        if (block.filterTarget === 'global' || block.filterTarget === 'both') {
            this.globalFilter = { ...block.filters };
        }
    }

    clearFilters() {
        this.pageFilter = {};
        this.globalFilter = {};
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
    }

    updateSolutionName(solution: Solution, value: string) {
        solution.display_name = value;
    }

    updateSolutionColor(solution: Solution, value: string) {
        solution.color = value;
    }

    copySelectedBlockJson() {
        const block = this.selectedBlock();
        if (!block) return;
        this.clipboard = JSON.stringify(block, null, 2);
        navigator.clipboard?.writeText(this.clipboard);
        this.commonService.showSwalToast('JSON copié !');
    }

    pasteBlockJson() {
        if (!this.clipboard.trim()) {
            this.commonService.showSwalToast('Aucun JSON à coller.', 'error');
            return;
        }

        try {
            const parsedBlock = JSON.parse(this.clipboard) as RangePageBlock;
            parsedBlock.id = this.createBlockId();
            parsedBlock.x = Math.max(0, parsedBlock.x + 30);
            parsedBlock.y = Math.max(0, parsedBlock.y + 30);
            parsedBlock.zIndex = this.nextZIndex();
            this.page.blocks.push(parsedBlock);
            this.selectedBlockId = parsedBlock.id;
            this.commonService.showSwalToast('Bloc collé !');
        } catch {
            this.commonService.showSwalToast('JSON PokerHL invalide.', 'error');
        }
    }

    saveCustomRangeAsSituation(block: RangePageBlock) {
        if (!block.customRange) return;
        this.situationService.addSituation(block.customRange);
        block.trainable = true;
        this.commonService.showSwalToast('Range envoyée dans les situations !');
    }

    goBack() {
        this.router.navigate(['range-pages']);
    }

    blockStyle(block: RangePageBlock) {
        return {
            left: `${block.x}px`,
            top: `${block.y}px`,
            width: `${block.w}px`,
            height: `${block.h}px`,
            'z-index': block.zIndex
        };
    }

    cellSize(block: RangePageBlock): number {
        return block.cellSize || this.page.displaySettings.cellSize;
    }

    createBlockId(): string {
        return `block_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    }

    nextZIndex(): number {
        return Math.max(0, ...this.page.blocks.map(block => block.zIndex || 0)) + 1;
    }

    getNextColor(solutions: Solution[]): string {
        const colors = ['#d80c05', '#ff9100', '#7a5a00', '#3f7a89', '#96c582', '#303030', '#1c51ff', '#00aeff', '#8350ff', '#e284ff'];
        const usedColors = solutions.map(solution => solution.color);
        return colors.find(color => !usedColors.includes(color)) || '#303030';
    }
}
