import { NgClass, NgStyle } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { cloneDeep } from 'lodash';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputTextModule } from 'primeng/inputtext';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { RangePage, RangePageBlock } from '../../interfaces/range-page';
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
    imports: [FormsModule, NgStyle, NgClass, SolutionColorPipe, InputTextModule, AutoCompleteModule],
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
    private draggedPosition?: {
        blockId: string;
        index: number;
    };

    page: RangePage = this.createEmptyPage();
    situations: Situation[] = [];
    situationSuggestions: Situation[] = [];
    selectedBlockId?: string;
    editingBlockId?: string;
    selectedSituationId?: number;
    selectedSituation?: Situation;
    showExistingSituationPopup = false;
    activeSolutionId = 'unique_solution_0';
    isPainting = false;
    mode: 'new' | 'edit' = 'new';
    saveStatus = 'Enregistré';

    readonly gridSize = 12;
    readonly canvasWidth = 2400;
    readonly canvasHeight = 1440;
    readonly minBlockWidth = this.gridSize * 10;
    readonly minBlockHeight = this.gridSize * 8;

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

        this.page.blocks = (this.page.blocks || [])
            .filter(block => block.type === 'range' || block.type === 'text' || block.type === 'positions')
            .map(block => this.normalizeBlock(block));
    }

    normalizeBlock(block: RangePageBlock): RangePageBlock {
        const normalizedBlock = { ...block };
        const minSize = this.minSizeForBlock(normalizedBlock);

        normalizedBlock.x = this.snapToGrid(normalizedBlock.x || 0, 0, this.canvasWidth - minSize.width);
        normalizedBlock.y = this.snapToGrid(normalizedBlock.y || 0, 0, this.canvasHeight - minSize.height);
        normalizedBlock.w = this.snapToGrid(normalizedBlock.w || minSize.width, minSize.width, this.canvasWidth - normalizedBlock.x);
        normalizedBlock.h = this.snapToGrid(normalizedBlock.h || minSize.height, minSize.height, this.canvasHeight - normalizedBlock.y);
        normalizedBlock.zIndex = normalizedBlock.zIndex || this.nextZIndex();

        if (normalizedBlock.type === 'range') {
            normalizedBlock.cellSize = normalizedBlock.cellSize || this.page.displaySettings.cellSize;
            normalizedBlock.compact = normalizedBlock.compact ?? this.page.displaySettings.compact;
            normalizedBlock.showLegend = normalizedBlock.showLegend ?? this.page.displaySettings.showLegend;
            const rangeMinSize = this.minSizeForBlock(normalizedBlock);
            normalizedBlock.w = Math.max(normalizedBlock.w, rangeMinSize.width);
            normalizedBlock.h = rangeMinSize.height;
        }

        if (normalizedBlock.type === 'positions' && !normalizedBlock.positions) {
            normalizedBlock.positions = [];
        }

        if (normalizedBlock.type === 'positions') {
            normalizedBlock.h = this.positionBlockHeight(normalizedBlock);
        }

        return normalizedBlock;
    }

    addRangeBlock(source: 'situation' | 'custom') {
        if (source === 'situation' && this.selectedSituationId === undefined) {
            this.commonService.showSwalToast('Veuillez sélectionner une situation.', 'error');
            return;
        }

        const baseRange = cloneDeep(this.commonService.empty_situation_obj);
        baseRange.name = 'Situation vierge';
        const selectedSituation = this.situations.find(situation => situation.id === this.selectedSituationId);

        const position = this.nextBlockPosition();
        const block: RangePageBlock = {
            id: this.createBlockId(),
            type: 'range',
            title: source === 'situation' ? selectedSituation?.name : 'Situation vierge',
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
        this.editingBlockId = undefined;
        this.scheduleAutoSave();
    }

    openExistingSituationPopup() {
        this.selectedSituationId = undefined;
        this.selectedSituation = undefined;
        this.situationSuggestions = this.situations;
        this.showExistingSituationPopup = true;
    }

    addExistingSituationBlock() {
        this.selectedSituationId = this.selectedSituation?.id;
        const blockCount = this.page.blocks.length;
        this.addRangeBlock('situation');

        if (this.page.blocks.length > blockCount) {
            this.selectedSituationId = undefined;
            this.selectedSituation = undefined;
            this.showExistingSituationPopup = false;
        }
    }

    closeExistingSituationPopup() {
        this.showExistingSituationPopup = false;
        this.selectedSituationId = undefined;
        this.selectedSituation = undefined;
    }

    searchSituations(event: { query: string }) {
        const query = event.query.toLowerCase().trim();
        this.situationSuggestions = this.situations.filter(situation =>
            (situation.name || '').toLowerCase().includes(query)
        );
    }

    selectExistingSituation(event: { value: Situation }) {
        this.selectedSituation = event.value;
        this.selectedSituationId = event.value.id;
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
        this.editingBlockId = undefined;
        this.scheduleAutoSave();
    }

    addPositionsBlock() {
        const position = this.nextBlockPosition();
        const block: RangePageBlock = {
            id: this.createBlockId(),
            type: 'positions',
            title: 'Positions',
            positions: [],
            x: position.x,
            y: position.y,
            w: this.gridSize * 14,
            h: this.gridSize * 28,
            zIndex: this.nextZIndex()
        };

        this.page.blocks.push(this.normalizeBlock(block));
        this.selectedBlockId = block.id;
        this.editingBlockId = undefined;
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

    fitAndScheduleAutoSave(block: RangePageBlock) {
        if (block.type === 'range' || block.type === 'positions') {
            block.h = this.minSizeForBlock(block).height;
        }
        this.scheduleAutoSave();
    }

    selectedBlock(): RangePageBlock | undefined {
        return this.page.blocks.find(block => block.id === this.selectedBlockId);
    }

    selectBlock(block: RangePageBlock) {
        if (this.selectedBlockId !== block.id) {
            this.editingBlockId = undefined;
        }
        this.selectedBlockId = block.id;
        block.zIndex = this.nextZIndex();
    }

    editBlock(block: RangePageBlock) {
        this.selectBlock(block);
        this.editingBlockId = block.id;
    }

    removeBlock(blockId: string) {
        Swal.fire({
            title: 'Attention !',
            text: 'Voulez-vous vraiment supprimer ce bloc ?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#303030',
            cancelButtonColor: '#d74c4c',
            confirmButtonText: 'Oui, supprimer !',
            cancelButtonText: 'Annuler'
        }).then((result) => {
            if (result.isConfirmed) {
                this.page.blocks = this.page.blocks.filter(block => block.id !== blockId);
                if (this.selectedBlockId === blockId) {
                    this.selectedBlockId = undefined;
                }
                if (this.editingBlockId === blockId) {
                    this.editingBlockId = undefined;
                }
                this.scheduleAutoSave();
                this.commonService.showSwalToast('Bloc supprimé !');
            }
        });
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
        this.editingBlockId = undefined;
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
        if (mode === 'resize' && !this.isEditing(block)) return;
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
        if (this.dragState.mode === 'resize' && !this.isEditing(block)) {
            this.dragState = undefined;
            return;
        }

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

    paintCell(block: RangePageBlock, rowIndex: number, cellIndex: number) {
        if (!this.isEditing(block) || block.source !== 'custom' || !block.customRange) return;
        block.customRange.situations[rowIndex][cellIndex].solution = this.activeSolutionId;
        this.scheduleAutoSave();
    }

    startPainting(block: RangePageBlock, rowIndex: number, cellIndex: number) {
        if (!this.isEditing(block)) return;
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

    addPositionItem(block: RangePageBlock) {
        if (!block.positions) block.positions = [];
        block.positions.push(`${block.positions.length + 1}`);
        this.fitAndScheduleAutoSave(block);
    }

    removePositionItem(block: RangePageBlock, index: number) {
        if (!block.positions) return;
        block.positions.splice(index, 1);
        this.fitAndScheduleAutoSave(block);
    }

    startPositionDrag(event: DragEvent, block: RangePageBlock, index: number) {
        if (!this.isEditing(block)) return;
        event.stopPropagation();
        this.draggedPosition = { blockId: block.id, index };
        event.dataTransfer?.setData('text/plain', index.toString());
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
        }
    }

    allowPositionDrop(event: DragEvent, block: RangePageBlock) {
        if (!this.isEditing(block)) return;
        event.preventDefault();
        event.stopPropagation();
    }

    dropPosition(event: DragEvent, block: RangePageBlock, targetIndex: number) {
        event.preventDefault();
        event.stopPropagation();
        if (!block.positions || this.draggedPosition?.blockId !== block.id) return;

        const insertIndex = this.draggedPosition.index < targetIndex ? targetIndex - 1 : targetIndex;
        const [item] = block.positions.splice(this.draggedPosition.index, 1);
        block.positions.splice(insertIndex, 0, item);
        this.draggedPosition = undefined;
        this.fitAndScheduleAutoSave(block);
    }

    endPositionDrag() {
        this.draggedPosition = undefined;
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

    isEditing(block: RangePageBlock): boolean {
        return this.editingBlockId === block.id;
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

        if (block.type === 'text') {
            return {
                width: this.gridSize * 8,
                height: this.gridSize * 4
            };
        }

        if (block.type === 'positions') {
            return {
                width: this.gridSize * 10,
                height: this.positionBlockHeight(block)
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

    private positionBlockHeight(block: RangePageBlock): number {
        const headerHeight = 40;
        const paddingHeight = 24;
        const rowHeight = 28;
        const contentHeight = headerHeight + paddingHeight + (((block.positions || []).length + 1) * rowHeight);
        return this.snapToGrid(contentHeight, this.gridSize * 8, this.canvasHeight);
    }

}
