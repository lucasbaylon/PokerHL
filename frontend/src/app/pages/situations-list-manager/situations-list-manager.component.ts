import { NgStyle } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FilterService } from 'primeng/api';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { Subscription } from 'rxjs';
import { AppModalComponent } from '../../components/app-modal/app-modal.component';
import { RangeGridComponent } from '../../components/range-grid/range-grid.component';
import { IN_RANGE, Situation, describeActionLine, isPostflop } from '../../interfaces/situation';
import { Solution } from '../../interfaces/solution';
import { OpponentLevelPipe } from '../../pipes/opponent-level.pipe';
import { PositionPipe } from '../../pipes/position.pipe';
import { SolutionColorPipe } from '../../pipes/solution-color.pipe';
import { FlopTypePipe } from '../../pipes/flop-type.pipe';
import { FLOP_TYPES, flopTypeName } from '../../services/flop.service';
import { describeCondition } from '../../services/flop-rules';
import { TypePipe } from '../../pipes/type.pipe';
import { SituationService } from '../../services/situation.service';
import { CommonService } from './../../services/common.service';

@Component({
    selector: 'app-situations-list-manager',
    standalone: true,
    imports: [TableModule, OpponentLevelPipe, PositionPipe, TypePipe, FlopTypePipe, FormsModule, MultiSelectModule, TooltipModule, SolutionColorPipe, NgStyle, AppModalComponent, RangeGridComponent],
    templateUrl: './situations-list-manager.component.html'
})
export class SituationsListManagerComponent implements AfterViewInit, OnDestroy {

    private situationsSubscription!: Subscription;
    private resizeFrameId?: number;
    private readonly defaultHeaderHeight = 64;
    private readonly defaultPaginatorHeight = 56;
    private readonly defaultRowHeight = 65;
    private readonly minRowsPerPage = 4;
    private readonly pageBottomSpacing = 24;
    private selectedSituationIdsToRestore = new Set<number>();
    situationList: Situation[] = [];
    selectedSituations: Situation[] = [];

    nbRowsPerPage = 11;

    opponentLevelLst = [
        { name: 'Fish', value: "fish" },
        { name: 'Reg', value: "shark" },
        { name: 'Fish/Reg', value: "fish_shark" }
    ];

    private readonly situationTypeOptions = [
        { name: 'Pré-flop', value: "preflop" },
        { name: 'Flop', value: "flop" },
        { name: 'Turn', value: "turn" },
        { name: 'River', value: "river" }
    ];

    /** Options du filtre Type : types de situation, puis types de flop présents dans les situations (voir updateTypeLst). */
    typeLst: { label: string, items: { name: string, value: string }[] }[] = [
        { label: 'Type', items: this.situationTypeOptions }
    ];

    positionLst = [
        { name: 'SB', value: "sb" },
        { name: 'BB', value: "bb" },
        { name: 'BU', value: "bu" }
    ];

    nbPlayerLst = [
        { name: '2', value: 2 },
        { name: '3', value: 3 }
    ];

    situationToDisplay!: Situation;
    readonly describeCondition = describeCondition;
    readonly describeActionLine = describeActionLine;
    readonly isPostflop = isPostflop;
    readonly rangeSolution: Solution = { id: IN_RANGE, type: 'unique', display_name: 'Dans la range', color: '#16a34a' };

    /**
     * Solutions servant à colorer la grille : pour une situation postflop, la grille est la range du héros.
     */
    gridSolutions(situation: Situation): Solution[] {
        return isPostflop(situation.type) ? [...situation.solutions, this.rangeSolution] : situation.solutions;
    }

    /** Street d'une situation postflop, avec son article (« au flop », « au turn », « à la river »). */
    streetLabel(situation: Situation): string {
        return situation.type === 'river' ? 'à la river' : situation.type === 'turn' ? 'au turn' : 'au flop';
    }

    /** Conditions de board d'une situation postflop, par street (listes vides omises). */
    boardConditionGroups(situation: Situation): { label: string, conditions: string[] }[] {
        return [
            { label: 'Flop', conditions: situation.boardConditions ?? [] },
            { label: 'Turn', conditions: situation.type !== 'flop' ? situation.turnConditions ?? [] : [] },
            { label: 'River', conditions: situation.type === 'river' ? situation.riverConditions ?? [] : [] }
        ].map(group => ({ label: group.label, conditions: group.conditions.map(describeCondition) }))
            .filter(group => group.conditions.length);
    }

    /** Nom d'affichage d'une action de la situation. */
    solutionName(situation: Situation, solutionId: string | undefined): string {
        return situation.solutions.find(solution => solution.id === solutionId)?.display_name ?? '—';
    }

    showSituationModal = false;
    showRemoveSituationModal = false;
    situationIdsToRemove: number[] = [];

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private apiSituation: SituationService,
        protected commonService: CommonService,
        private filterService: FilterService
    ) {
        this.filterService.register(this.situationTypeMatchMode, (id: number, selected: string[] | null) =>
            this.matchesTypeFilter(this.situationList.find(situation => situation.id === id), selected)
        );
    }

    /** Mode de filtre de la colonne Type (appliqué sur l'id pour accéder à toute la situation). */
    readonly situationTypeMatchMode = 'situationType';

    /**
     * Une situation passe le filtre Type si son type est coché,
     * ou si c'est une situation postflop dont l'un des types de flop est coché.
     */
    private matchesTypeFilter(situation: Situation | undefined, selected: string[] | null): boolean {
        if (!selected || selected.length === 0) {
            return true;
        }
        if (!situation) {
            return false;
        }
        if (selected.includes(situation.type)) {
            return true;
        }
        return isPostflop(situation.type) && this.flopTypesOf(situation).some(type => selected.includes(type));
    }

    /** Ajuste le nombre de lignes au redimensionnement de la fenêtre. */
    @HostListener('window:resize')
    onResize() {
        this.scheduleRowsPerPageUpdate();
    }

    @ViewChild('multiSelect') multiSelect!: MultiSelect;
    @ViewChild('tableContainer') tableContainer!: ElementRef<HTMLElement>;
    /**
     * Ouvre le composant MultiSelect.
     */
    openMultiSelect(){
        this.multiSelect.show();
    }

    /**
     * Initialise le composant et s'abonne à la liste des situations.
     */
    ngAfterViewInit(): void {
        this.scheduleRowsPerPageUpdate();
    }

    ngOnInit(): void {
        if (this.activatedRoute.snapshot.params.hasOwnProperty('selectedSituationList')) {
            const selectedSituations = JSON.parse(this.activatedRoute.snapshot.params['selectedSituationList']) as Situation[];
            this.selectedSituationIdsToRestore = new Set(
                selectedSituations
                    .map(situation => situation.id)
                    .filter((id): id is number => id !== undefined)
            );
            const currentUrl = this.router.url;
            const baseUrl = currentUrl.split(';')[0];
            this.router.navigateByUrl(baseUrl);
        }

        this.situationsSubscription = this.apiSituation.situations.subscribe(data => {
            this.situationList = data.sort((a: Situation, b: Situation) => {
                if (a.name && b.name) {
                    // Extraction des parties textuelles et numériques
                    const extractParts = (name: string): [string, number] => {
                        const match = name.match(/([^\d]+)(\d+)?/);
                        const textPart = match ? match[1] : name;
                        const numberPart = match && match[2] ? parseInt(match[2], 10) : Number.MAX_SAFE_INTEGER;
                        return [textPart, numberPart];
                    };

                    const [textA, numberA] = extractParts(a.name);
                    const [textB, numberB] = extractParts(b.name);

                    // Comparaison des parties textuelles
                    const textComparison = textA.localeCompare(textB);
                    if (textComparison !== 0) {
                        return textComparison;
                    }

                    // Comparaison des parties numériques
                    return numberA - numberB;
                }
                return 0; // Si l'un des noms est undefined, ils restent dans leur position actuelle
            });

            this.updateTypeLst();

            // Une suppression ou un rafraîchissement ne doit pas conserver de sélection fantôme.
            const availableIds = new Set(this.situationList.map(situation => situation.id));
            this.selectedSituations = this.selectedSituations.filter(situation => availableIds.has(situation.id));
            if (this.selectedSituationIdsToRestore.size > 0) {
                this.selectedSituations = this.situationList.filter(situation =>
                    situation.id !== undefined && this.selectedSituationIdsToRestore.has(situation.id)
                );
                this.selectedSituationIdsToRestore.clear();
            }
            this.scheduleRowsPerPageUpdate();
        });

        this.apiSituation.getSituations();
    }

    ngOnDestroy(): void {
        this.situationsSubscription.unsubscribe();

        if (this.resizeFrameId !== undefined) {
            cancelAnimationFrame(this.resizeFrameId);
        }
    }

    /**
     * Types de flop cochables dans le filtre : uniquement ceux utilisés par les situations, dans l'ordre de FLOP_TYPES.
     */
    private updateTypeLst() {
        const usedTypes = new Set(this.situationList.filter(situation => isPostflop(situation.type)).flatMap(situation => this.flopTypesOf(situation)));
        const flopTypeOptions = FLOP_TYPES
            .filter(type => usedTypes.has(type.code))
            .map(type => ({ name: type.name, value: type.code }));
        this.typeLst = [
            { label: 'Type', items: this.situationTypeOptions },
            ...(flopTypeOptions.length ? [{ label: 'Types de flop', items: flopTypeOptions }] : [])
        ];
    }

    /**
     * Types de flop d'une situation (ancien champ flopType compris).
     */
    flopTypesOf(situation: Situation): string[] {
        return situation.flopTypes ?? (situation.flopType ? [situation.flopType] : []);
    }

    /**
     * Noms des types de flop d'une situation, un par ligne (infobulle de la colonne Type).
     */
    flopTypeNamesOf(situation: Situation): string {
        return this.flopTypesOf(situation).map(code => flopTypeName(code) ?? code).join('\n');
    }

    private scheduleRowsPerPageUpdate() {
        if (this.resizeFrameId !== undefined) {
            cancelAnimationFrame(this.resizeFrameId);
        }

        this.resizeFrameId = requestAnimationFrame(() => {
            this.resizeFrameId = undefined;
            this.updateRowsPerPage();
        });
    }

    private updateRowsPerPage() {
        const tableElement = this.tableContainer?.nativeElement;

        if (!tableElement) {
            return;
        }

        const availableHeight = window.innerHeight - tableElement.getBoundingClientRect().top - this.pageBottomSpacing;
        const headerHeight = tableElement.querySelector('thead')?.getBoundingClientRect().height || this.defaultHeaderHeight;
        const rowHeight = tableElement.querySelector('tbody tr')?.getBoundingClientRect().height || this.defaultRowHeight;
        const rowsWithoutPaginator = Math.floor((availableHeight - headerHeight) / rowHeight);
        const needsPaginator = this.situationList.length > rowsWithoutPaginator;
        const paginatorHeight = needsPaginator
            ? tableElement.querySelector('.p-paginator')?.getBoundingClientRect().height || this.defaultPaginatorHeight
            : 0;
        const rowsPerPage = Math.max(
            this.minRowsPerPage,
            Math.floor((availableHeight - headerHeight - paginatorHeight) / rowHeight)
        );

        this.nbRowsPerPage = rowsPerPage;
    }

    /**
     * Affiche les détails d'une situation dans une modal.
     * @param situation La situation à afficher.
     */
    displaySituation(situation: Situation) {
        this.situationToDisplay = situation;
        this.showSituationModal = true;
    }

    closeSituationModal() {
        this.showSituationModal = false;
    }

    /**
     * Navigue vers le manager pour éditer une situation.
     * @param id Identifiant de la situation.
     */
    editSituation(id: string) {
        this.router.navigate(['situations-manager', { situation_id: id }]);
    }

    /** Ouvre le choix du mode avec les situations sélectionnées. */
    startTraining() {
        if (this.selectedSituations.length === 0) {
            this.commonService.showSwalToast('Sélectionnez au moins une situation.', 'error');
            return;
        }

        this.router.navigate(['select-training-mode', {
            situationList: JSON.stringify(this.selectedSituations)
        }]);
    }

    /**
     * Duplique une situation existante via le service API.
     * @param id Identifiant de la situation à dupliquer.
     */
    duplicateSituation(id: string) {
        this.apiSituation.duplicateSituation(id);
        this.commonService.showSwalToast(`Situation dupliquée !`);
    }

    /**
     * Supprime une situation après confirmation de l'utilisateur.
     * @param id Identifiant de la situation à supprimer.
     */
    removeSituation(id?: number) {
        if (id === undefined) return;
        this.situationIdsToRemove = [id];
        this.showRemoveSituationModal = true;
    }

    onClickFileImport(event: Event) {
        const input = event.target as HTMLInputElement;
        const files = input.files;
        if (!files || this.selectedSituations.length > 0) return;

        const handleFileImport = (file: File, type: 'application/zip' | 'application/json') => {
            const blob = new Blob([file], { type });
            const importObservable = type === 'application/zip'
                ? this.apiSituation.importZIPSituationsForUser(blob)
                : this.apiSituation.importJSONSituationsForUser(file.name, blob);

            importObservable.subscribe({
                next: response => {
                    this.commonService.showSwalToast(`${response.count} fichier(s) importé(s) avec succès !`);
                    this.apiSituation.getSituations();
                },
                error: () => this.commonService.showSwalToast(`Échec de l'import`, 'error')
            });
        };

        for (const file of Array.from(files)) {
            if (['application/zip', 'application/x-compressed', 'application/x-zip-compressed'].includes(file.type)) {
                handleFileImport(file, 'application/zip');
            } else if (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')) {
                handleFileImport(file, 'application/json');
            } else {
                this.commonService.showSwalToast(`Veuillez sélectionner un fichier zip ou json.`, 'error');
            }
        }
        input.value = '';
    }

    exportSelectedSituations() {
        const ids = this.selectedSituations
            .map(situation => situation.id)
            .filter((id): id is number => id !== undefined);
        if (ids.length === 0) return;

        this.apiSituation.exportSituationsForUser(ids).subscribe({
            next: () => this.commonService.showSwalToast(
                `${ids.length} situation${ids.length > 1 ? 's' : ''} exportée${ids.length > 1 ? 's' : ''} !`
            ),
            error: () => this.commonService.showSwalToast(`Échec de l'export`, 'error')
        });
    }

    removeSelectedSituations() {
        const selectedIds = this.selectedSituations
            .map(situation => situation.id)
            .filter((id): id is number => id !== undefined);

        if (selectedIds.length === 0) {
            this.commonService.showSwalToast('Sélectionnez au moins une situation.', 'error');
            return;
        }

        this.situationIdsToRemove = selectedIds;
        this.showRemoveSituationModal = true;
    }

    closeRemoveSituationModal() {
        this.showRemoveSituationModal = false;
        this.situationIdsToRemove = [];
    }

    confirmRemoveSituation() {
        if (this.situationIdsToRemove.length === 0) return;
        this.situationIdsToRemove.forEach(id => this.apiSituation.removeSituation(id.toString()));
        this.selectedSituations = [];
        this.commonService.showSwalToast(
            this.situationIdsToRemove.length > 1 ? 'Situations supprimées !' : 'Situation supprimée !'
        );
        this.closeRemoveSituationModal();
    }

}
