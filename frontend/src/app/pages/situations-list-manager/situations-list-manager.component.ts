import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener } from '@angular/core';
import { Situation } from '../../interfaces/situation';
import { Router } from '@angular/router';
import { SituationService } from '../../services/situation.service';
import { DealerPipe } from '../../pipes/dealer.pipe';
import { OpponentLevelPipe } from '../../pipes/opponent-level.pipe';
import { TableModule } from 'primeng/table';
import { CommonService } from './../../services/common.service';
import { PaginatorModule } from 'primeng/paginator';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-situations-list-manager',
    standalone: true,
    imports: [TableModule, DealerPipe, OpponentLevelPipe, PaginatorModule],
    templateUrl: './situations-list-manager.component.html',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SituationsListManagerComponent {

    situationList: Situation[] = [];

    paginatedSituationList: any[] = [];

    nbRowsPerPage = 10;

    totalRecords: number = 0;

    paginatorAnimationDelay = "0s"

    constructor(
        private router: Router,
        private apiSituation: SituationService,
        protected commonService: CommonService
    ) { }

    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        if (event.target.innerHeight > 1080) {
            this.nbRowsPerPage = 10;
        } else {
            this.nbRowsPerPage = 7;
        }
        this.paginatorAnimationDelay = 0.1 + this.nbRowsPerPage * 0.075 + 's';
    }

    ngOnInit(): void {
        this.apiSituation.situations.subscribe(data => {
            this.situationList = data;

            this.loadPageData(0, this.nbRowsPerPage);

            this.totalRecords = this.situationList.length;
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
            title:'Attention !',
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

    loadPageData(first: number, rows: number) {
        this.paginatedSituationList = this.situationList.slice(first, first + rows);
    }

    onPageChange(event: any) {
        this.loadPageData(event.first, event.rows);
    }

}
