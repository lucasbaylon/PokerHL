import { NgClass, NgStyle } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { cloneDeep } from 'lodash';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputTextModule } from 'primeng/inputtext';
import { Subscription } from 'rxjs';
import { RangePage, RangePageBlock } from '../../interfaces/range-page';
import { Situation } from '../../interfaces/situation';
import { SolutionColorPipe } from '../../pipes/solution-color.pipe';
import { CommonService } from '../../services/common.service';
import { RangePageService } from '../../services/range-page.service';
import { SituationService } from '../../services/situation.service';
import { AppModalComponent } from '../../components/app-modal/app-modal.component';

type DragMode = 'move' | 'resize';
type ResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
type AnchorSide = 'top' | 'right' | 'bottom' | 'left';

interface PositionSituationTypeOption {
    name: string;
    situation: Situation;
}

interface BlockConnectionLine {
    id: string;
    positionBlockId: string;
    rangeBlockId: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

@Component({
    selector: 'app-range-page-editor',
    standalone: true,
    imports: [FormsModule, NgStyle, NgClass, SolutionColorPipe, InputTextModule, AutoCompleteModule, AppModalComponent],
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
        resizeDirection?: ResizeDirection;
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
    private autoExpandedBlocks = new Map<string, { width: number; originalX: number; expandedX: number; }>();
    private connectionDrag?: {
        line: BlockConnectionLine;
        movingType: 'positions' | 'range';
        startClientX: number;
        startClientY: number;
        canvasLeft: number;
        canvasTop: number;
        moved: boolean;
        point: { x: number; y: number; };
    };
    private linkCreationDrag?: {
        sourceBlockId: string;
        startClientX: number;
        startClientY: number;
        canvasLeft: number;
        canvasTop: number;
        sourcePoint: { x: number; y: number; };
        point: { x: number; y: number; };
        moved: boolean;
    };

    page: RangePage = this.createEmptyPage();
    situations: Situation[] = [];
    positionSituationSuggestions: PositionSituationTypeOption[] = [];
    selectedBlockId?: string;
    selectedBlockIds: string[] = [];
    editingBlockId?: string;
    actionsMenuBlockId?: string;
    headerActionsBlockId?: string;
    actionsMenuPlacement: 'above' | 'below' = 'above';
    selectedPositionSituation?: PositionSituationTypeOption;
    selectedRangePositionBlockId?: string;
    showPositionSituationPopup = false;
    showRangeSituationPopup = false;
    showGridHelpPopup = false;
    showRemoveBlockModal = false;
    blockIdToRemove?: string;
    mode: 'new' | 'edit' = 'new';
    saveStatus = 'Enregistré';
    linkMode = false;
    linkModeRootBlockId?: string;
    linkSourceBlockId?: string;
    selectedConnectionId?: string;
    reconnectingConnection?: { positionBlockId: string; rangeBlockId: string; movingType: 'positions' | 'range'; };

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
        window.addEventListener('keydown', this.onWindowKeyDown);
    }

    ngOnDestroy(): void {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        this.rangePageSubscription.unsubscribe();
        this.situationsSubscription.unsubscribe();
        window.removeEventListener('mousemove', this.onWindowMouseMove);
        window.removeEventListener('mouseup', this.onWindowMouseUp);
        window.removeEventListener('keydown', this.onWindowKeyDown);
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

        const rangeIds = this.page.blocks.filter(block => block.type === 'range').map(block => block.id);
        const defaultRangeId = rangeIds[0];
        this.page.blocks.filter(block => block.type === 'positions').forEach(block => {
            const existingIds = [
                ...(block.linkedRangeBlockIds || []),
                ...(block.linkedRangeBlockId ? [block.linkedRangeBlockId] : [])
            ].filter(id => rangeIds.includes(id));
            block.linkedRangeBlockIds = [...new Set(existingIds.length > 0 ? existingIds : (defaultRangeId ? [defaultRangeId] : []))];
            block.linkedRangeBlockId = block.linkedRangeBlockIds[0];
        });
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

    openRangeSituationPopup() {
        if (this.positionBlocks().length === 0) {
            this.commonService.showSwalToast('Créez d’abord un bloc de positions.', 'error');
            return;
        }
        this.selectedRangePositionBlockId = undefined;
        this.showRangeSituationPopup = true;
    }

    closeRangeSituationPopup() {
        this.selectedRangePositionBlockId = undefined;
        this.showRangeSituationPopup = false;
    }

    positionBlocks(): RangePageBlock[] {
        return this.page.blocks.filter(block => block.type === 'positions');
    }

    addRangeBlock() {
        const positionBlock = this.page.blocks.find(block =>
            block.id === this.selectedRangePositionBlockId && block.type === 'positions'
        );
        const referenceSituation = positionBlock ? this.positionReferenceForBlock(positionBlock) : undefined;
        if (!positionBlock || !referenceSituation?.id) {
            this.commonService.showSwalToast('Veuillez sélectionner un bloc de positions.', 'error');
            return;
        }

        const position = this.nextBlockPosition();
        const block: RangePageBlock = {
            id: this.createBlockId(),
            type: 'range',
            title: referenceSituation.name,
            source: 'situation',
            situationId: referenceSituation.id,
            x: position.x,
            y: position.y,
            w: this.gridSize * 24,
            h: this.gridSize * 24,
            zIndex: this.nextZIndex(),
            cellSize: this.page.displaySettings.cellSize,
            compact: this.page.displaySettings.compact,
            showLegend: this.page.displaySettings.showLegend
        };

        const normalizedBlock = this.normalizeBlock(block);
        this.page.blocks.push(normalizedBlock);
        positionBlock.linkedRangeBlockIds = [...new Set([...(positionBlock.linkedRangeBlockIds || []), normalizedBlock.id])];
        positionBlock.linkedRangeBlockId = positionBlock.linkedRangeBlockIds[0];
        this.selectedBlockId = normalizedBlock.id;
        this.selectedBlockIds = [normalizedBlock.id];
        this.closeRangeSituationPopup();
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
            positionsBlock.linkedRangeBlockIds = [existingRangeBlock.id];
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
        positionsBlock.linkedRangeBlockIds = [normalizedBlock.id];
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
            this.restoreAutoExpandedBlock(this.selectedBlockId);
            this.editingBlockId = undefined;
            this.actionsMenuBlockId = undefined;
            this.headerActionsBlockId = undefined;
        }
        this.selectedBlockId = block.id;
        if (!keepMultiSelection || !this.selectedBlockIds.includes(block.id)) {
            this.selectedBlockIds = [block.id];
        }
        block.zIndex = this.nextZIndex();
    }

    clearBlockSelection() {
        this.restoreAutoExpandedBlock(this.selectedBlockId);
        this.selectedBlockId = undefined;
        this.selectedBlockIds = [];
        this.editingBlockId = undefined;
        this.actionsMenuBlockId = undefined;
        this.headerActionsBlockId = undefined;
    }

    toggleBlockActions(block: RangePageBlock, event: MouseEvent) {
        const button = event.currentTarget as HTMLElement;
        const buttonRect = button.getBoundingClientRect();
        const viewportTop = button.closest('.app-scrollbar')?.getBoundingClientRect().top || 0;
        this.actionsMenuPlacement = buttonRect.top - 44 < viewportTop ? 'below' : 'above';
        this.actionsMenuBlockId = this.actionsMenuBlockId === block.id ? undefined : block.id;
    }

    isBlockActionsOpen(block: RangePageBlock): boolean {
        return this.actionsMenuBlockId === block.id;
    }

    isHeaderActionsVisible(block: RangePageBlock): boolean {
        return this.headerActionsBlockId === block.id;
    }

    toggleLinkMode(block: RangePageBlock) {
        const shouldClose = this.linkMode && this.linkModeRootBlockId === block.id;
        this.linkMode = !shouldClose;
        this.linkModeRootBlockId = shouldClose ? undefined : block.id;
        this.linkSourceBlockId = undefined;
        this.selectedConnectionId = undefined;
        this.reconnectingConnection = undefined;
        this.linkCreationDrag = undefined;
        this.connectionDrag = undefined;
        this.actionsMenuBlockId = undefined;
    }

    exitLinkMode() {
        this.linkMode = false;
        this.linkModeRootBlockId = undefined;
        this.linkSourceBlockId = undefined;
        this.selectedConnectionId = undefined;
        this.reconnectingConnection = undefined;
        this.linkCreationDrag = undefined;
        this.connectionDrag = undefined;
        this.actionsMenuBlockId = undefined;
    }

    isBlockInLinkScope(block: RangePageBlock): boolean {
        return this.linkMode && (block.type === 'positions' || block.type === 'range');
    }

    selectLinkAnchor(block: RangePageBlock) {
        if (!this.linkMode || (block.type !== 'positions' && block.type !== 'range')) return;
        if (this.reconnectingConnection) {
            this.reconnectConnection(block);
            return;
        }
        if (!this.linkSourceBlockId) {
            this.linkSourceBlockId = block.id;
            return;
        }
        if (this.linkSourceBlockId === block.id) {
            this.linkSourceBlockId = undefined;
            return;
        }

        const source = this.page.blocks.find(item => item.id === this.linkSourceBlockId);
        if (!source || source.type === block.type) {
            this.commonService.showSwalToast('Reliez un bloc de positions à un bloc de ranges.', 'error');
            return;
        }

        const positionBlock = source.type === 'positions' ? source : block;
        const rangeBlock = source.type === 'range' ? source : block;
        const linkedIds = positionBlock.linkedRangeBlockIds || [];
        if (linkedIds.includes(rangeBlock.id)) {
            if (linkedIds.length === 1) {
                this.commonService.showSwalToast('Un bloc de positions doit conserver au moins une range.', 'error');
                return;
            }
            positionBlock.linkedRangeBlockIds = linkedIds.filter(id => id !== rangeBlock.id);
        } else {
            positionBlock.linkedRangeBlockIds = [...linkedIds, rangeBlock.id];
        }
        positionBlock.linkedRangeBlockId = positionBlock.linkedRangeBlockIds[0];
        this.linkSourceBlockId = undefined;
        this.scheduleAutoSave();
    }

    startLinkDrag(event: MouseEvent, block: RangePageBlock, side: AnchorSide) {
        event.preventDefault();
        event.stopPropagation();
        const canvas = (event.currentTarget as HTMLElement).closest('[data-range-canvas]');
        const canvasRect = canvas?.getBoundingClientRect();
        if (!canvasRect) return;
        const sourcePoint = this.anchorPoint(block, side);
        this.linkSourceBlockId = block.id;
        this.selectedConnectionId = undefined;
        this.linkCreationDrag = {
            sourceBlockId: block.id,
            startClientX: event.clientX,
            startClientY: event.clientY,
            canvasLeft: canvasRect.left,
            canvasTop: canvasRect.top,
            sourcePoint,
            point: sourcePoint,
            moved: false
        };
    }

    private anchorPoint(block: RangePageBlock, side: AnchorSide): { x: number; y: number; } {
        if (side === 'top') return { x: block.x + block.w / 2, y: block.y };
        if (side === 'right') return { x: block.x + block.w, y: block.y + block.h / 2 };
        if (side === 'bottom') return { x: block.x + block.w / 2, y: block.y + block.h };
        return { x: block.x, y: block.y + block.h / 2 };
    }

    private createConnection(source: RangePageBlock, target: RangePageBlock) {
        if (source.type === target.type || source.type === 'text' || target.type === 'text') return;
        const positionBlock = source.type === 'positions' ? source : target;
        const rangeBlock = source.type === 'range' ? source : target;
        const linkedIds = positionBlock.linkedRangeBlockIds || [];
        if (!linkedIds.includes(rangeBlock.id)) {
            positionBlock.linkedRangeBlockIds = [...linkedIds, rangeBlock.id];
            positionBlock.linkedRangeBlockId = positionBlock.linkedRangeBlockIds[0];
            this.scheduleAutoSave();
        }
    }

    selectConnection(line: BlockConnectionLine, event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.selectedConnectionId = line.id;
        this.linkSourceBlockId = undefined;
        this.reconnectingConnection = undefined;
        const svgRect = (event.currentTarget as SVGElement).ownerSVGElement?.getBoundingClientRect();
        if (!svgRect) return;
        const point = {
            x: (event.clientX - svgRect.left) / this.zoomLevel,
            y: (event.clientY - svgRect.top) / this.zoomLevel
        };
        const sourceDistance = Math.hypot(point.x - line.x1, point.y - line.y1);
        const targetDistance = Math.hypot(point.x - line.x2, point.y - line.y2);
        this.connectionDrag = {
            line,
            movingType: sourceDistance <= targetDistance ? 'positions' : 'range',
            startClientX: event.clientX,
            startClientY: event.clientY,
            canvasLeft: svgRect.left,
            canvasTop: svgRect.top,
            moved: false,
            point
        };
    }

    startConnectionReconnect(line: BlockConnectionLine, movingType: 'positions' | 'range', event: MouseEvent) {
        event.stopPropagation();
        this.selectedConnectionId = line.id;
        this.reconnectingConnection = {
            positionBlockId: line.positionBlockId,
            rangeBlockId: line.rangeBlockId,
            movingType
        };
    }

    reconnectConnection(target: RangePageBlock) {
        const connection = this.reconnectingConnection;
        if (!connection || target.type !== connection.movingType) return;
        const oldPosition = this.page.blocks.find(block => block.id === connection.positionBlockId && block.type === 'positions');
        if (!oldPosition) return;

        if (connection.movingType === 'range') {
            oldPosition.linkedRangeBlockIds = [
                ...(oldPosition.linkedRangeBlockIds || []).filter(id => id !== connection.rangeBlockId),
                target.id
            ];
            oldPosition.linkedRangeBlockIds = [...new Set(oldPosition.linkedRangeBlockIds)];
            oldPosition.linkedRangeBlockId = oldPosition.linkedRangeBlockIds[0];
        } else {
            const targetPosition = target;
            const oldLinks = oldPosition.linkedRangeBlockIds || [];
            if (oldLinks.length === 1) {
                this.commonService.showSwalToast('Le bloc de positions source doit conserver au moins une range.', 'error');
                return;
            }
            oldPosition.linkedRangeBlockIds = oldLinks.filter(id => id !== connection.rangeBlockId);
            oldPosition.linkedRangeBlockId = oldPosition.linkedRangeBlockIds[0];
            targetPosition.linkedRangeBlockIds = [...new Set([...(targetPosition.linkedRangeBlockIds || []), connection.rangeBlockId])];
            targetPosition.linkedRangeBlockId = targetPosition.linkedRangeBlockIds[0];
        }

        this.reconnectingConnection = undefined;
        this.selectedConnectionId = undefined;
        this.scheduleAutoSave();
    }

    removeConnection(line: BlockConnectionLine, event?: MouseEvent) {
        event?.stopPropagation();
        const positionBlock = this.page.blocks.find(block => block.id === line.positionBlockId && block.type === 'positions');
        if (!positionBlock) return;
        const linkedIds = positionBlock.linkedRangeBlockIds || [];
        if (linkedIds.length === 1) {
            this.commonService.showSwalToast('Un bloc de positions doit conserver au moins une range.', 'error');
            return;
        }
        positionBlock.linkedRangeBlockIds = linkedIds.filter(id => id !== line.rangeBlockId);
        positionBlock.linkedRangeBlockId = positionBlock.linkedRangeBlockIds[0];
        this.selectedConnectionId = undefined;
        this.scheduleAutoSave();
    }

    connectionPreview(): { x1: number; y1: number; x2: number; y2: number; } | undefined {
        if (this.linkCreationDrag?.moved) {
            return {
                x1: this.linkCreationDrag.sourcePoint.x,
                y1: this.linkCreationDrag.sourcePoint.y,
                x2: this.linkCreationDrag.point.x,
                y2: this.linkCreationDrag.point.y
            };
        }
        const drag = this.connectionDrag;
        if (!drag?.moved) return undefined;
        return drag.movingType === 'positions'
            ? { x1: drag.point.x, y1: drag.point.y, x2: drag.line.x2, y2: drag.line.y2 }
            : { x1: drag.line.x1, y1: drag.line.y1, x2: drag.point.x, y2: drag.point.y };
    }

    connectionLines(): BlockConnectionLine[] {
        const lines: BlockConnectionLine[] = [];
        this.page.blocks.filter(block => block.type === 'positions').forEach(positionBlock => {
            (positionBlock.linkedRangeBlockIds || []).forEach(rangeId => {
                const rangeBlock = this.page.blocks.find(block => block.id === rangeId && block.type === 'range');
                if (!rangeBlock) return;
                const positionCenter = { x: positionBlock.x + positionBlock.w / 2, y: positionBlock.y + positionBlock.h / 2 };
                const rangeCenter = { x: rangeBlock.x + rangeBlock.w / 2, y: rangeBlock.y + rangeBlock.h / 2 };
                const horizontal = Math.abs(rangeCenter.x - positionCenter.x) >= Math.abs(rangeCenter.y - positionCenter.y);
                lines.push({
                    id: `${positionBlock.id}_${rangeBlock.id}`,
                    positionBlockId: positionBlock.id,
                    rangeBlockId: rangeBlock.id,
                    x1: horizontal ? positionBlock.x + (rangeCenter.x >= positionCenter.x ? positionBlock.w : 0) : positionCenter.x,
                    y1: horizontal ? positionCenter.y : positionBlock.y + (rangeCenter.y >= positionCenter.y ? positionBlock.h : 0),
                    x2: horizontal ? rangeBlock.x + (rangeCenter.x >= positionCenter.x ? 0 : rangeBlock.w) : rangeCenter.x,
                    y2: horizontal ? rangeCenter.y : rangeBlock.y + (rangeCenter.y >= positionCenter.y ? 0 : rangeBlock.h)
                });
            });
        });
        return lines;
    }

    editBlock(block: RangePageBlock) {
        this.selectBlock(block);
        this.actionsMenuBlockId = undefined;
        this.editingBlockId = block.id;
    }

    removeBlock(blockId: string) {
        this.blockIdToRemove = blockId;
        this.showRemoveBlockModal = true;
    }

    closeRemoveBlockModal() {
        this.showRemoveBlockModal = false;
        this.blockIdToRemove = undefined;
    }

    confirmRemoveBlock() {
        if (!this.blockIdToRemove) return;
        const blockId = this.blockIdToRemove;
        const block = this.page.blocks.find(item => item.id === blockId);
        if (block?.type === 'range') {
            const orphanedPosition = this.page.blocks.find(item =>
                item.type === 'positions'
                && (item.linkedRangeBlockIds || []).includes(blockId)
                && (item.linkedRangeBlockIds || []).length === 1
            );
            if (orphanedPosition) {
                this.commonService.showSwalToast('Reliez d’abord ce bloc de positions à une autre range.', 'error');
                this.closeRemoveBlockModal();
                return;
            }
            this.page.blocks.filter(item => item.type === 'positions').forEach(item => {
                item.linkedRangeBlockIds = (item.linkedRangeBlockIds || []).filter(id => id !== blockId);
                item.linkedRangeBlockId = item.linkedRangeBlockIds[0];
            });
        }
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
        this.closeRemoveBlockModal();
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
        const stack = Number(position.trim().match(/[\d.]+/)?.[0]);
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
        if (positionBlock) {
            const linkedIds = positionBlock.linkedRangeBlockIds
                || (positionBlock.linkedRangeBlockId ? [positionBlock.linkedRangeBlockId] : []);
            return this.page.blocks.filter(block => block.type === 'range' && linkedIds.includes(block.id));
        }

        return [];
    }

    startDrag(event: MouseEvent, block: RangePageBlock, mode: DragMode, resizeDirection?: ResizeDirection) {
        event.preventDefault();
        event.stopPropagation();
        if (mode === 'move') {
            this.ensureHeaderActionsFit(event, block);
        } else {
            this.autoExpandedBlocks.delete(block.id);
            this.actionsMenuBlockId = undefined;
            this.headerActionsBlockId = undefined;
        }
        this.selectBlock(block, mode === 'move');
        if (mode === 'move') {
            this.headerActionsBlockId = block.id;
        }
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
            resizeDirection,
            groupOriginalPositions: groupBlocks.map(item => ({ id: item.id, x: item.x, y: item.y, w: item.w, h: item.h }))
        };
    }

    private ensureHeaderActionsFit(event: MouseEvent, block: RangePageBlock) {
        const header = event.currentTarget as HTMLElement | null;
        const title = header?.querySelector('span') as HTMLElement | null;
        if (!title) return;

        const range = document.createRange();
        range.selectNodeContents(title);
        const titleWidth = Math.ceil(range.getBoundingClientRect().width);
        range.detach();

        const requiredWidth = this.snapToGrid(titleWidth + 72, this.minBlockWidth, this.canvasWidth);
        if (block.w >= requiredWidth) return;

        const originalWidth = block.w;
        const originalX = block.x;
        block.w = requiredWidth;
        block.x = this.snapToGrid(Math.min(block.x, this.canvasWidth - block.w), 0, this.canvasWidth - block.w);
        if (!this.autoExpandedBlocks.has(block.id)) {
            this.autoExpandedBlocks.set(block.id, { width: originalWidth, originalX, expandedX: block.x });
        }
    }

    private restoreAutoExpandedBlock(blockId?: string) {
        if (!blockId) return;
        const initialSize = this.autoExpandedBlocks.get(blockId);
        const block = this.page.blocks.find(item => item.id === blockId);
        if (!initialSize || !block) return;

        const movedBy = block.x - initialSize.expandedX;
        block.w = initialSize.width;
        block.x = this.snapToGrid(initialSize.originalX + movedBy, 0, this.canvasWidth - block.w);
        this.autoExpandedBlocks.delete(blockId);
    }

    onWindowMouseMove = (event: MouseEvent) => {
        if (this.linkCreationDrag) {
            this.linkCreationDrag.moved ||= Math.hypot(
                event.clientX - this.linkCreationDrag.startClientX,
                event.clientY - this.linkCreationDrag.startClientY
            ) > 4;
            if (this.linkCreationDrag.moved) {
                this.linkCreationDrag.point = {
                    x: (event.clientX - this.linkCreationDrag.canvasLeft) / this.zoomLevel,
                    y: (event.clientY - this.linkCreationDrag.canvasTop) / this.zoomLevel
                };
            }
            return;
        }

        if (this.connectionDrag) {
            this.connectionDrag.moved ||= Math.hypot(
                event.clientX - this.connectionDrag.startClientX,
                event.clientY - this.connectionDrag.startClientY
            ) > 4;
            if (this.connectionDrag.moved) {
                this.connectionDrag.point = {
                    x: (event.clientX - this.connectionDrag.canvasLeft) / this.zoomLevel,
                    y: (event.clientY - this.connectionDrag.canvasTop) / this.zoomLevel
                };
                this.reconnectingConnection = {
                    positionBlockId: this.connectionDrag.line.positionBlockId,
                    rangeBlockId: this.connectionDrag.line.rangeBlockId,
                    movingType: this.connectionDrag.movingType
                };
            }
            return;
        }

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
        const deltaX = (event.clientX - this.dragState.startX) / this.zoomLevel;
        const deltaY = (event.clientY - this.dragState.startY) / this.zoomLevel;

        if (this.dragState.mode === 'move') {
            this.moveSelectedBlocks(deltaX, deltaY);
        } else {
            const minSize = this.minSizeForBlock(block);
            const direction = this.dragState.resizeDirection || 'se';

            if (direction.includes('e')) {
                block.w = this.snapToGrid(this.dragState.originalW + deltaX, minSize.width, this.canvasWidth - block.x);
            }
            if (direction.includes('s')) {
                block.h = this.snapToGrid(this.dragState.originalH + deltaY, minSize.height, this.canvasHeight - block.y);
            }
            if (direction.includes('w')) {
                const maxX = this.dragState.originalX + this.dragState.originalW - minSize.width;
                block.x = this.snapToGrid(this.dragState.originalX + deltaX, 0, maxX);
                block.w = this.dragState.originalW + (this.dragState.originalX - block.x);
            }
            if (direction.includes('n')) {
                const maxY = this.dragState.originalY + this.dragState.originalH - minSize.height;
                block.y = this.snapToGrid(this.dragState.originalY + deltaY, 0, maxY);
                block.h = this.dragState.originalH + (this.dragState.originalY - block.y);
            }
        }
    };

    onWindowMouseUp = (event: MouseEvent) => {
        if (this.linkCreationDrag) {
            const linkDrag = this.linkCreationDrag;
            this.linkCreationDrag = undefined;
            if (linkDrag.moved) {
                const targetElement = document.elementFromPoint(event.clientX, event.clientY)
                    ?.closest<HTMLElement>('[data-link-anchor-block-id]');
                const sourceBlock = this.page.blocks.find(block => block.id === linkDrag.sourceBlockId);
                const targetBlock = this.page.blocks.find(block => block.id === targetElement?.dataset['linkAnchorBlockId']);
                if (sourceBlock && targetBlock && sourceBlock.id !== targetBlock.id) {
                    this.createConnection(sourceBlock, targetBlock);
                }
                this.linkSourceBlockId = undefined;
            }
            return;
        }

        if (this.connectionDrag) {
            const connectionDrag = this.connectionDrag;
            this.connectionDrag = undefined;
            if (connectionDrag.moved) {
                const targetElement = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-block-id]');
                const targetBlock = this.page.blocks.find(block => block.id === targetElement?.dataset['blockId']);
                if (targetBlock && targetBlock.type === connectionDrag.movingType) {
                    this.reconnectConnection(targetBlock);
                } else {
                    this.reconnectingConnection = undefined;
                }
            }
            return;
        }

        const shouldAutoSave = this.dragState !== undefined;
        this.dragState = undefined;
        this.selectionState = undefined;
        if (shouldAutoSave) {
            this.scheduleAutoSave();
        }
    };

    onWindowKeyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        if (event.key !== 'Delete' || !this.linkMode || !this.selectedConnectionId
            || target?.matches('input, textarea, select, [contenteditable="true"]')) return;
        const line = this.connectionLines().find(item => item.id === this.selectedConnectionId);
        if (!line) return;
        event.preventDefault();
        this.removeConnection(line);
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

        this.selectedConnectionId = undefined;
        this.reconnectingConnection = undefined;

        const canvas = event.currentTarget as HTMLElement;
        const rect = canvas.getBoundingClientRect();
        const startX = (event.clientX - rect.left) / this.zoomLevel;
        const startY = (event.clientY - rect.top) / this.zoomLevel;

        this.restoreAutoExpandedBlock(this.selectedBlockId);
        this.editingBlockId = undefined;
        this.headerActionsBlockId = undefined;
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
            'z-index': block.zIndex,
            transition: this.isResizing(block) ? 'none' : undefined
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

    isResizing(block: RangePageBlock): boolean {
        return this.dragState?.mode === 'resize' && this.dragState.blockId === block.id;
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
