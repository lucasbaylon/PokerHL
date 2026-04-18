import { NgStyle } from '@angular/common';
import { Component, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
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
    imports: [TableModule, DealerPipe, OpponentLevelPipe, PositionPipe, TypePipe, FormsModule, MultiSelectModule, SolutionColorPipe, NgStyle],
    templateUrl: './situations-list-manager.component.html'
})
export class SituationsListManagerComponent implements OnDestroy {

    private situationsSubscription!: Subscription;
    situationList: Situation[] = [];

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

    constructor(
        private router: Router,
        private apiSituation: SituationService,
        protected commonService: CommonService
    ) { }

    /**
     * Gère le redimensionnement de la fenêtre pour ajuster le nombre de lignes par page.
     * @param event L'événement de redimensionnement.
     */
    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        this.nbRowsPerPage = this.commonService.getNbRowsPerPage(event.target.innerHeight);
    }

    @ViewChild('multiSelect') multiSelect!: MultiSelect;
    /**
     * Ouvre le composant MultiSelect.
     */
    openMultiSelect(){
        this.multiSelect.show();
    }

    /**
     * Initialise le composant et s'abonne à la liste des situations.
     */
    ngOnDestroy(): void {
        this.situationsSubscription.unsubscribe();
    }

    ngOnInit(): void {
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
        });

        this.apiSituation.getSituations();

        this.nbRowsPerPage = this.commonService.getNbRowsPerPage(window.innerHeight);
    }

    /**
     * Affiche les détails d'une situation dans une modal.
     * @param situation La situation à afficher.
     */
    displaySituation(situation: Situation) {
        this.situationToDisplay = situation;
        this.commonService.showModal('displaySituationModal');
    }

    /**
     * Navigue vers le manager pour éditer une situation.
     * @param id Identifiant de la situation.
     */
    editSituation(id: string) {
        this.router.navigate(['situations-manager', { situation_id: id }]);
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
        Swal.fire({
            title: 'Attention !',
            text: 'Voulez vous vraiment supprimer cette situation ? Vous ne pourrez pas revenir en arrière.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#303030',
            cancelButtonColor: '#d74c4c',
            confirmButtonText: 'Oui, supprimer !',
            cancelButtonText: 'Annuler'
        }).then((result) => {
            if (result.isConfirmed) {
                this.apiSituation.removeSituation(id);
                this.commonService.showSwalToast(`Situation supprimée !`);
            }
        });
    }

}
