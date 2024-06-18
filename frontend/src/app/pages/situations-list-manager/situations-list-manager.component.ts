import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener } from '@angular/core';
import { Situation } from '../../interfaces/situation';
import { Router } from '@angular/router';
import { SituationService } from '../../services/situation.service';
import { DealerPipe } from '../../pipes/dealer.pipe';
import { OpponentLevelPipe } from '../../pipes/opponent-level.pipe';
import { TableModule } from 'primeng/table';
import { CommonService } from './../../services/common.service';
import { MultiSelectModule } from 'primeng/multiselect';
import Swal from 'sweetalert2';
import { PositionPipe } from '../../pipes/position.pipe';
import { TypePipe } from '../../pipes/type.pipe';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-situations-list-manager',
    standalone: true,
    imports: [TableModule, DealerPipe, OpponentLevelPipe, PositionPipe, TypePipe, FormsModule, MultiSelectModule],
    templateUrl: './situations-list-manager.component.html'
})
export class SituationsListManagerComponent {

    situationList: Situation[] = [];

    nbRowsPerPage = 11;

    opponentLevelList = [
        { name: 'Débutant', value: "fish" },
        { name: 'Confirmé', value: "shark" },
        { name: 'Débutant/Confirmé', value: "fish_shark" }
    ];

    selectedOpponentLevels: any[] = [];

    constructor(
        private router: Router,
        private apiSituation: SituationService,
        protected commonService: CommonService
    ) { }

    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        if (event.target.innerHeight > 1080) {
            this.nbRowsPerPage = 11;
        } else {
            this.nbRowsPerPage = 7;
        }
    }

    ngOnInit(): void {
        this.apiSituation.situations.subscribe(data => {
            this.situationList = data;
        });

        this.apiSituation.getSituations();

        if (window.innerHeight <= 1080) {
            this.nbRowsPerPage = 7;
        }
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
