import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener } from '@angular/core';
import { SituationService } from '../../services/situation.service';
import { Router } from '@angular/router';
import { Situation } from '../../interfaces/situation';
import Swal from 'sweetalert2';
import { TableModule } from 'primeng/table';
import { DealerPipe } from '../../pipes/dealer.pipe';
import { OpponentLevelPipe } from '../../pipes/opponent-level.pipe';
import { PaginatorModule } from 'primeng/paginator';
import { CommonService } from '../../services/common.service';

@Component({
    selector: 'app-situations-list-training',
    standalone: true,
    imports: [TableModule, DealerPipe, OpponentLevelPipe, PaginatorModule],
    templateUrl: './situations-list-training.component.html',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SituationsListTrainingComponent {

    situationList: Situation[] = [];

    paginatedSituationList: any[] = [];

    selectedSituations: Situation[] = [];

    checkedSituations: number[] = [];

    nbRowsPerPage = 10;

    totalRecords: number = 0;

    constructor(
        private router: Router,
        private apiSituation: SituationService,
        public commonService: CommonService,
    ) { }

    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        if (event.target.innerHeight > 1080) {
            this.nbRowsPerPage = 10;
        } else {
            this.nbRowsPerPage = 7;
        }
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

    redirectTo(page: string) {
        this.router.navigate([page]);
    }

    onStartTrainingButton() {
        if (this.selectedSituations.length === 0) {
            this.commonService.showSwalToast('Veuillez sélectionner au moins une situation.', 'error');
        } else {
            this.router.navigate(['training', { situationList: JSON.stringify(this.selectedSituations) }]);
        }
    }

    loadPageData(first: number, rows: number) {
        this.paginatedSituationList = this.situationList.slice(first, first + rows);
    }

    onPageChange(event: any) {
        this.loadPageData(event.first, event.rows);
    }

}
