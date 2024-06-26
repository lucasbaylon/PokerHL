import { Component, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import Swal from 'sweetalert2';
import { Situation } from '../../interfaces/situation';
import { DealerPipe } from '../../pipes/dealer.pipe';
import { OpponentLevelPipe } from '../../pipes/opponent-level.pipe';
import { PositionPipe } from '../../pipes/position.pipe';
import { TypePipe } from '../../pipes/type.pipe';
import { SituationService } from '../../services/situation.service';
import { CommonService } from './../../services/common.service';

@Component({
    selector: 'app-situations-list-manager',
    standalone: true,
    imports: [TableModule, DealerPipe, OpponentLevelPipe, PositionPipe, TypePipe, FormsModule, MultiSelectModule],
    templateUrl: './situations-list-manager.component.html'
})
export class SituationsListManagerComponent {

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

    constructor(
        private router: Router,
        private apiSituation: SituationService,
        protected commonService: CommonService
    ) { }

    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        this.nbRowsPerPage = this.commonService.getNbRowsPerPage(event.target.innerHeight);
    }

    @ViewChild('multiSelect') multiSelect!: MultiSelect;
    openMultiSelect(){
        this.multiSelect.show();
    }

    ngOnInit(): void {
        this.apiSituation.situations.subscribe(data => {
            this.situationList = data.sort((a: Situation, b: Situation) => {
                if (a.name && b.name) {
                    return a.name.localeCompare(b.name);
                }
                return 0; // Si l'un des noms est undefined, ils restent dans leur position actuelle
            });
        });

        this.apiSituation.getSituations();

        this.nbRowsPerPage = this.commonService.getNbRowsPerPage(window.innerHeight);
    }

    editSituation(id: string) {
        this.router.navigate(['situations-manager', { situation_id: id }]);
    }

    duplicateSituation(id: string) {
        this.apiSituation.duplicateSituation(id);
        this.commonService.showSwalToast(`Situation dupliquée !`);
    }

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
