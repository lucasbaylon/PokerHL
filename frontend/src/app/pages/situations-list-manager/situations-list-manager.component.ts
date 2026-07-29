import { NgStyle } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { Subscription } from 'rxjs';
import { AppModalComponent } from '../../components/app-modal/app-modal.component';
import { Situation } from '../../interfaces/situation';
import { DealerPipe } from '../../pipes/dealer.pipe';
import { OpponentLevelPipe } from '../../pipes/opponent-level.pipe';
import { PositionPipe } from '../../pipes/position.pipe';
import { SolutionColorPipe } from '../../pipes/solution-color.pipe';
import { TypePipe } from '../../pipes/type.pipe';
import { SituationService } from '../../services/situation.service';
import { CommonService } from './../../services/common.service';

@Component({
    selector: 'app-situations-list-manager',
    standalone: true,
    imports: [TableModule, DealerPipe, OpponentLevelPipe, PositionPipe, TypePipe, FormsModule, MultiSelectModule, SolutionColorPipe, NgStyle, AppModalComponent],
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

    typeLst = [
        { name: 'Pré-flop', value: "preflop" },
        { name: 'Flop', value: "flop" }
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
    showSituationModal = false;
    showRemoveSituationModal = false;
    situationIdToRemove?: string;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private apiSituation: SituationService,
        protected commonService: CommonService
    ) { }

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
    removeSituation(id: string) {
        this.situationIdToRemove = id;
        this.showRemoveSituationModal = true;
    }

    closeRemoveSituationModal() {
        this.showRemoveSituationModal = false;
        this.situationIdToRemove = undefined;
    }

    confirmRemoveSituation() {
        if (!this.situationIdToRemove) return;
        this.apiSituation.removeSituation(this.situationIdToRemove);
        this.commonService.showSwalToast(`Situation supprimée !`);
        this.closeRemoveSituationModal();
    }

}
