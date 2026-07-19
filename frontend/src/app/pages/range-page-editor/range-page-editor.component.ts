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
import { SolutionColorPipe } from '../../pipes/solution-color.pipe';
import { CommonService } from '../../services/common.service';
import { RangePageService } from '../../services/range-page.service';
import { SituationService } from '../../services/situation.service';

type DragMode = 'move' | 'resize';

interface PositionSituationTypeOption {
    name: string;
    situation: Situation;
}

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
        groupOriginalPositions?: Array<{ id: string; x: number; y: number; w: number; h: number; }>;
    };
    private selectionState?: {
        startX: number;
        startY: number;
        currentX: number;
        currentY: number;
        canvasLeft: number;
        canvasTop: number;
    };
    private draggedPosition?: {
        blockId: string;
        index: number;
    };

    page: RangePage = this.createEmptyPage();
    situations: Situation[] = [];
    positionSituationSuggestions: PositionSituationTypeOption[] = [];
    selectedBlockId?: string;
    selectedBlockIds: string[] = [];
    editingBlockId?: string;
    selectedPositionSituation?: PositionSituationTypeOption;
    showPositionSituationPopup = false;
    showGridHelpPopup = false;
    mode: 'new' | 'edit' = 'new';
    saveStatus = 'Enregistré';

    zoomLevel = 1;

    readonly gridSize = 12;
    readonly canvasWidth = 2400;
    readonly canvasHeight = 1440;
    readonly minBlockWidth = this.gridSize * 10;
    readonly minBlockHeight = this.gridSize * 8;
    readonly minZoomLevel = 0.35;
    readonly maxZoomLevel = 2;
    readonly zoomStep = 0.1;

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
            this.refreshPositionBlocks();
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

        if (normalizedBlock.type === 'positions' && this.situations.length > 0) {
            this.refreshPositionBlock(normalizedBlock);
        }

        if (normalizedBlock.type === 'positions') {
            normalizedBlock.h = this.positionBlockHeight(normalizedBlock);
        }

        return normalizedBlock;
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
        this.selectedBlockIds = [block.id];
        this.editingBlockId = undefined;
        this.scheduleAutoSave();
    }

    positionSituationTypeOptions(): PositionSituationTypeOption[] {
        const optionsByKey = new Map<string, PositionSituationTypeOption>();

        this.situations.forEach(situation => {
            const key = this.situationTypeKey(situation);
            if (optionsByKey.has(key)) return;

            optionsByKey.set(key, {
                name: this.situationTypeDisplayName(situation),
                situation
            });
        });

        return [...optionsByKey.values()].sort((a, b) => a.name.localeCompare(b.name));
    }

    situationTypeDisplayName(situation: Situation): string {
        const nameWithoutDeep = this.removeDeepFromSituationName(situation.name);
        if (nameWithoutDeep) return nameWithoutDeep;

        return this.generateSituationTypeName(situation);
    }

    removeDeepFromSituationName(name: string | undefined): string {
        return (name || '')
            .replace(/\s+\d+\s*d\b/i, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    generateSituationTypeName(situation: Situation): string {
        const mode = situation.nbPlayer === 2
            ? 'HU'
            : situation.previousPlayer1Action === 'Fold' ? 'BVB' : '3w';
        const position = this.positionName(situation.position);
        const action = this.situationActionLabel(situation);
        const level = this.opponentLevelName(situation.opponentLevel).toUpperCase();

        return `${mode} ${position} ${action}${level}`.replace(/\s{2,}/g, ' ').trim();
    }

    situationActionLabel(situation: Situation): string {
        const isFirstToAct = (situation.nbPlayer === 2 && situation.position === 'sb')
            || (situation.nbPlayer === 3 && situation.position === 'bu');
        if (isFirstToAct) return '';

        let lastAction = 'Fold';
        if (situation.nbPlayer === 2) {
            lastAction = situation.previousPlayer1Action || 'Fold';
        } else if (situation.position === 'sb') {
            lastAction = situation.previousPlayer1Action || 'Fold';
        } else if (situation.position === 'bb') {
            lastAction = situation.previousPlayer2Action !== 'Fold'
                ? situation.previousPlayer2Action || 'Fold'
                : situation.previousPlayer1Action || 'Fold';
        }

        if (lastAction === 'Limp' || lastAction === 'Call') return 'vs limp ';
        if (lastAction.startsWith('Raise')) return 'vs open ';
        if (lastAction === 'All In') return 'vs OS ';
        return '';
    }

    positionName(position: string | undefined): string {
        return ({ sb: 'SB', bb: 'BB', bu: 'BU' } as Record<string, string>)[position || ''] || '';
    }

    opponentLevelName(level: string | undefined): string {
        return ({ fish: 'Fish', shark: 'Reg', fish_shark: 'Mixte' } as Record<string, string>)[level || ''] || '';
    }

    situationTypeKey(situation: Situation): string {
        return [
            situation.type,
            situation.nbPlayer,
            situation.position,
            situation.opponentLevel,
            situation.fishPosition,
            situation.previousPlayer1Action,
            situation.previousPlayer2Action
        ].join('|');
    }

    openPositionSituationPopup() {
        this.selectedPositionSituation = undefined;
        this.positionSituationSuggestions = this.positionSituationTypeOptions();
        this.showPositionSituationPopup = true;
    }

    closePositionSituationPopup() {
        this.selectedPositionSituation = undefined;
        this.showPositionSituationPopup = false;
    }

    searchPositionSituations(event: { query: string }) {
        const query = event.query.toLowerCase().trim();
        this.positionSituationSuggestions = this.positionSituationTypeOptions().filter(option =>
            option.name.toLowerCase().includes(query)
        );
    }

    selectPositionSituation(event: { value: PositionSituationTypeOption }) {
        this.selectedPositionSituation = event.value;
    }

    addPositionsBlock() {
        if (!this.selectedPositionSituation?.situation.id) {
            this.commonService.showSwalToast('Veuillez sélectionner une situation.', 'error');
            return;
        }

        const positionTypeName = this.selectedPositionSituation.name;
        const referenceSituation = this.selectedPositionSituation.situation;
        const position = this.nextBlockPosition();
        const block: RangePageBlock = {
            id: this.createBlockId(),
            type: 'positions',
            title: positionTypeName,
            positions: [],
            positionSituationId: referenceSituation.id,
            positionReference: cloneDeep(referenceSituation),
            x: position.x,
            y: position.y,
            w: this.gridSize * 14,
            h: this.gridSize * 28,
            zIndex: this.nextZIndex()
        };

        this.refreshPositionBlock(block);
        const normalizedBlock = this.normalizeBlock(block);
        this.page.blocks.push(normalizedBlock);
        this.addSituationBlockForPositionType(referenceSituation, normalizedBlock);
        this.selectedBlockId = normalizedBlock.id;
        this.selectedBlockIds = [normalizedBlock.id];
        this.editingBlockId = undefined;
        this.selectedPositionSituation = undefined;
        this.showPositionSituationPopup = false;
        this.scheduleAutoSave();
    }

    addSituationBlockForPositionType(referenceSituation: Situation, positionsBlock: RangePageBlock) {
        const existingRangeBlock = this.page.blocks.find(block => block.type === 'range');

        if (existingRangeBlock) {
            positionsBlock.linkedRangeBlockId = existingRangeBlock.id;
            return;
        }

        const block: RangePageBlock = {
            id: this.createBlockId(),
            type: 'range',
            title: referenceSituation.name,
            source: 'situation',
            situationId: referenceSituation.id,
            x: this.snapToGrid(positionsBlock.x + positionsBlock.w + this.gridSize * 2, 0, this.canvasWidth - this.gridSize * 24),
            y: positionsBlock.y,
            w: this.gridSize * 24,
            h: this.gridSize * 24,
            zIndex: this.nextZIndex(),
            cellSize: this.page.displaySettings.cellSize,
            compact: this.page.displaySettings.compact,
            showLegend: this.page.displaySettings.showLegend
        };

        const normalizedBlock = this.normalizeBlock(block);
        this.page.blocks.push(normalizedBlock);
        positionsBlock.linkedRangeBlockId = normalizedBlock.id;
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

    selectBlock(block: RangePageBlock, keepMultiSelection = false) {
        if (this.selectedBlockId !== block.id) {
            this.editingBlockId = undefined;
        }
        this.selectedBlockId = block.id;
        if (!keepMultiSelection || !this.selectedBlockIds.includes(block.id)) {
            this.selectedBlockIds = [block.id];
        }
        block.zIndex = this.nextZIndex();
    }

    clearBlockSelection() {
        this.selectedBlockId = undefined;
        this.selectedBlockIds = [];
        this.editingBlockId = undefined;
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
                this.selectedBlockIds = this.selectedBlockIds.filter(id => id !== blockId);
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
        this.selectedBlockIds = [duplicatedBlock.id];
        this.editingBlockId = undefined;
        this.scheduleAutoSave();
    }

    rangeForBlock(block: RangePageBlock): Situation | undefined {
        return this.situations.find(situation => situation.id === block.situationId);
    }

    applyPositionToSituations(position: string, positionBlock?: RangePageBlock) {
        const stack = Number(position.trim().match(/\d+/)?.[0]);
        if (!stack) return;

        if (positionBlock) {
            positionBlock.selectedPosition = position;
        }

        const reference = positionBlock ? this.positionReferenceForBlock(positionBlock) : undefined;
        const existingSituation = reference ? this.findSimilarSituationWithStack(reference, stack) : undefined;
        if (!existingSituation) {
            this.scheduleAutoSave();
            this.commonService.showSwalToast('Aucune situation existante trouvee pour ce deep.', 'error');
            return;
        }

        const targetBlocks = this.targetRangeBlocksForPositionBlock(positionBlock);
        targetBlocks.forEach(block => {
            block.source = 'situation';
            block.situationId = existingSituation.id;
            block.title = existingSituation.name;
        });

        if (targetBlocks.length > 0) {
            this.scheduleAutoSave();
        }
    }

    targetRangeBlocksForPositionBlock(positionBlock?: RangePageBlock): RangePageBlock[] {
        if (positionBlock?.linkedRangeBlockId) {
            const linkedBlock = this.page.blocks.find(block => block.id === positionBlock.linkedRangeBlockId && block.type === 'range');
            if (linkedBlock) return [linkedBlock];
        }

        const firstRangeBlock = this.page.blocks.find(block => block.type === 'range');
        return firstRangeBlock ? [firstRangeBlock] : [];
    }

    startDrag(event: MouseEvent, block: RangePageBlock, mode: DragMode) {
        event.preventDefault();
        event.stopPropagation();
        this.selectBlock(block, mode === 'move');
        if (mode === 'resize' && !this.isEditing(block)) return;
        const groupBlocks = mode === 'move'
            ? this.page.blocks.filter(item => this.selectedBlockIds.includes(item.id))
            : [];
        this.dragState = {
            blockId: block.id,
            mode,
            startX: event.clientX,
            startY: event.clientY,
            originalX: block.x,
            originalY: block.y,
            originalW: block.w,
            originalH: block.h,
            groupOriginalPositions: groupBlocks.map(item => ({ id: item.id, x: item.x, y: item.y, w: item.w, h: item.h }))
        };
    }

    onWindowMouseMove = (event: MouseEvent) => {
        if (this.selectionState) {
            const point = this.canvasPointFromMouseEvent(event);
            this.selectionState.currentX = point.x;
            this.selectionState.currentY = point.y;
            this.updateSelectionFromBox();
            return;
        }

        if (!this.dragState) return;

        const block = this.page.blocks.find(item => item.id === this.dragState?.blockId);
        if (!block) return;
        if (this.dragState.mode === 'resize' && !this.isEditing(block)) {
            this.dragState = undefined;
            return;
        }

        const deltaX = (event.clientX - this.dragState.startX) / this.zoomLevel;
        const deltaY = (event.clientY - this.dragState.startY) / this.zoomLevel;

        if (this.dragState.mode === 'move') {
            this.moveSelectedBlocks(deltaX, deltaY);
        } else {
            const minSize = this.minSizeForBlock(block);
            block.w = this.snapToGrid(this.dragState.originalW + deltaX, minSize.width, this.canvasWidth - block.x);
            block.h = this.snapToGrid(this.dragState.originalH + deltaY, minSize.height, this.canvasHeight - block.y);
        }
    };

    onWindowMouseUp = () => {
        const shouldAutoSave = this.dragState !== undefined;
        this.dragState = undefined;
        this.selectionState = undefined;
        if (shouldAutoSave) {
            this.scheduleAutoSave();
        }
    };

    moveSelectedBlocks(deltaX: number, deltaY: number) {
        const group = this.dragState?.groupOriginalPositions || [];
        if (group.length === 0) return;

        const snappedDeltaX = this.snapToGrid(deltaX, -this.canvasWidth, this.canvasWidth);
        const snappedDeltaY = this.snapToGrid(deltaY, -this.canvasHeight, this.canvasHeight);
        const minDeltaX = Math.max(...group.map(block => -block.x));
        const maxDeltaX = Math.min(...group.map(block => this.canvasWidth - block.w - block.x));
        const minDeltaY = Math.max(...group.map(block => -block.y));
        const maxDeltaY = Math.min(...group.map(block => this.canvasHeight - block.h - block.y));
        const clampedDeltaX = Math.max(minDeltaX, Math.min(maxDeltaX, snappedDeltaX));
        const clampedDeltaY = Math.max(minDeltaY, Math.min(maxDeltaY, snappedDeltaY));

        group.forEach(originalBlock => {
            const block = this.page.blocks.find(item => item.id === originalBlock.id);
            if (!block) return;
            block.x = originalBlock.x + clampedDeltaX;
            block.y = originalBlock.y + clampedDeltaY;
        });
    }

    startSelection(event: MouseEvent) {
        if (event.button !== 0) return;
        event.preventDefault();

        const canvas = event.currentTarget as HTMLElement;
        const rect = canvas.getBoundingClientRect();
        const startX = (event.clientX - rect.left) / this.zoomLevel;
        const startY = (event.clientY - rect.top) / this.zoomLevel;

        this.editingBlockId = undefined;
        this.selectedBlockId = undefined;
        this.selectedBlockIds = [];
        this.selectionState = {
            startX,
            startY,
            currentX: startX,
            currentY: startY,
            canvasLeft: rect.left,
            canvasTop: rect.top
        };
    }

    canvasPointFromMouseEvent(event: MouseEvent) {
        return {
            x: (event.clientX - this.selectionState!.canvasLeft) / this.zoomLevel,
            y: (event.clientY - this.selectionState!.canvasTop) / this.zoomLevel
        };
    }

    updateSelectionFromBox() {
        const box = this.selectionBox();
        this.selectedBlockIds = this.page.blocks
            .filter(block => this.blocksIntersect(box, block))
            .map(block => block.id);
        this.selectedBlockId = this.selectedBlockIds[0];
    }

    blocksIntersect(box: { x: number; y: number; w: number; h: number }, block: RangePageBlock): boolean {
        return block.x < box.x + box.w
            && block.x + block.w > box.x
            && block.y < box.y + box.h
            && block.y + block.h > box.y;
    }

    selectionBox() {
        const state = this.selectionState;
        if (!state) return { x: 0, y: 0, w: 0, h: 0 };

        const x = Math.min(state.startX, state.currentX);
        const y = Math.min(state.startY, state.currentY);
        const w = Math.abs(state.currentX - state.startX);
        const h = Math.abs(state.currentY - state.startY);

        return { x, y, w, h };
    }

    selectionBoxStyle() {
        const box = this.selectionBox();
        return {
            left: `${box.x}px`,
            top: `${box.y}px`,
            width: `${box.w}px`,
            height: `${box.h}px`
        };
    }

    isSelectingBlocks(): boolean {
        return this.selectionState !== undefined;
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

    refreshPositionBlocks() {
        let hasChange = false;
        this.page.blocks
            .filter(block => block.type === 'positions')
            .forEach(block => {
                const previousPositions = JSON.stringify(block.positions || []);
                this.refreshPositionBlock(block);
                if (previousPositions !== JSON.stringify(block.positions || [])) {
                    hasChange = true;
                }
            });

        if (hasChange) {
            this.page.blocks = this.page.blocks.map(block => this.normalizeBlock(block));
        }
    }

    refreshPositionBlock(block: RangePageBlock) {
        const reference = this.positionReferenceForBlock(block);
        if (!reference) return;

        block.positionReference = cloneDeep(reference);
        block.positions = this.similarSituations(reference)
            .map(situation => situation.stack)
            .filter((stack): stack is number => stack !== undefined && stack !== null)
            .filter((stack, index, stacks) => stacks.indexOf(stack) === index)
            .sort((a, b) => b - a)
            .map(stack => stack.toString());
        block.h = this.positionBlockHeight(block);
    }

    positionReferenceForBlock(block: RangePageBlock): Situation | undefined {
        return this.situations.find(situation => situation.id === block.positionSituationId) || block.positionReference;
    }

    similarSituations(reference: Situation): Situation[] {
        return this.situations.filter(situation => this.sameSituationParametersExceptStack(situation, reference));
    }

    findSimilarSituationWithStack(reference: Situation, stack: number): Situation | undefined {
        return this.situations.find(situation =>
            this.sameSituationParametersExceptStack(situation, reference) && Number(situation.stack) === stack
        );
    }

    sameSituationParametersExceptStack(a: Situation, b: Situation): boolean {
        return a.type === b.type
            && a.nbPlayer === b.nbPlayer
            && a.position === b.position
            && a.opponentLevel === b.opponentLevel
            && a.fishPosition === b.fishPosition
            && a.previousPlayer1Action === b.previousPlayer1Action
            && a.previousPlayer2Action === b.previousPlayer2Action;
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

    scaledCanvasWidth(): number {
        return this.canvasWidth * this.zoomLevel;
    }

    scaledCanvasHeight(): number {
        return this.canvasHeight * this.zoomLevel;
    }

    canvasTransformStyle() {
        return {
            transform: `scale(${this.zoomLevel})`,
            'transform-origin': 'top left'
        };
    }

    canvasStyle() {
        return {
            ...this.canvasGridStyle(),
            ...this.canvasTransformStyle()
        };
    }

    isDefaultView(): boolean {
        return this.zoomLevel === 1;
    }

    resetView() {
        this.zoomLevel = 1;
    }

    onGridWheel(event: WheelEvent) {
        const container = event.currentTarget as HTMLElement;

        if (event.shiftKey && !event.ctrlKey) {
            event.preventDefault();
            event.stopPropagation();
            container.scrollLeft += event.deltaY;
            return;
        }

        if (!event.ctrlKey) return;

        event.preventDefault();
        event.stopPropagation();

        const previousZoom = this.zoomLevel;
        const direction = event.deltaY > 0 ? -1 : 1;
        const nextZoom = this.clampZoom(previousZoom + (direction * this.zoomStep));

        if (nextZoom === previousZoom) return;

        const rect = container.getBoundingClientRect();
        const pointerX = event.clientX - rect.left + container.scrollLeft;
        const pointerY = event.clientY - rect.top + container.scrollTop;
        const ratio = nextZoom / previousZoom;

        this.zoomLevel = nextZoom;
        container.scrollLeft = (pointerX * ratio) - (event.clientX - rect.left);
        container.scrollTop = (pointerY * ratio) - (event.clientY - rect.top);
    }

    clampZoom(value: number): number {
        const roundedValue = Math.round(value * 100) / 100;
        return Math.max(this.minZoomLevel, Math.min(this.maxZoomLevel, roundedValue));
    }

    canvasGridStyle() {
        const shouldShowGrid = this.dragState !== undefined || this.selectionState !== undefined;

        return {
            'background-size': `${this.gridSize}px ${this.gridSize}px`,
            'background-image': shouldShowGrid
                ? 'linear-gradient(to right, rgba(120,120,120,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,120,120,0.18) 1px, transparent 1px)'
                : 'none'
        };
    }

    cellSize(block: RangePageBlock): number {
        return block.cellSize || this.page.displaySettings.cellSize;
    }

    isSelected(block: RangePageBlock): boolean {
        return this.selectedBlockIds.includes(block.id);
    }

    isEditing(block: RangePageBlock): boolean {
        return this.editingBlockId === block.id;
    }

    isMovingBlock(block: RangePageBlock): boolean {
        return this.dragState?.mode === 'move' && this.selectedBlockIds.includes(block.id);
    }

    minSizeForBlock(block: RangePageBlock) {
        if (block.type === 'range') {
            const cellSize = block.cellSize || this.page.displaySettings.cellSize;
            const gridWidth = Math.ceil((cellSize + 4) * 13 + 32);
            return {
                width: this.snapToGrid(gridWidth, this.minBlockWidth, this.canvasWidth),
                height: this.rangeBlockHeight(block)
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

    private positionBlockHeight(block: RangePageBlock): number {
        const headerHeight = 40;
        const paddingHeight = 24;
        const rowHeight = 28;
        const contentHeight = headerHeight + paddingHeight + (((block.positions || []).length + 1) * rowHeight);
        return this.snapToGrid(contentHeight, this.gridSize * 8, this.canvasHeight);
    }

    private rangeBlockHeight(block: RangePageBlock): number {
        const cellSize = block.cellSize || this.page.displaySettings.cellSize;
        const renderedCellHeight = block.compact ? cellSize - 8 : cellSize;
        const titleHeight = 40;
        const bodyPadding = 24;
        const tableSpacing = 14 * 4;
        const tableHeight = (13 * renderedCellHeight) + tableSpacing;
        const legendHeight = block.showLegend ? 32 : 0;
        const editPanelHeight = this.isEditing(block) ? this.rangeEditPanelHeight(block) : 0;

        return this.snapToGrid(
            titleHeight + editPanelHeight + bodyPadding + tableHeight + legendHeight,
            this.minBlockHeight,
            this.canvasHeight
        );
    }

    private rangeEditPanelHeight(_block: RangePageBlock): number {
        return 49;
    }

}
