import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener } from '@angular/core';
import { SituationService } from '../../services/situation.service';
import { Router } from '@angular/router';
import { Situation } from '../../interfaces/situation';
import { TableModule } from 'primeng/table';
import { DealerPipe } from '../../pipes/dealer.pipe';
import { OpponentLevelPipe } from '../../pipes/opponent-level.pipe';
import { PaginatorModule } from 'primeng/paginator';
import { PositionPipe } from '../../pipes/position.pipe';
import { CommonService } from '../../services/common.service';
import { TypePipe } from '../../pipes/type.pipe';

@Component({
    selector: 'app-situations-list-training',
    standalone: true,
    imports: [TableModule, DealerPipe, OpponentLevelPipe, PaginatorModule, PositionPipe, TypePipe],
    templateUrl: './situations-list-training.component.html',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SituationsListTrainingComponent {

    situationList: Situation[] = [];

    selectedSituations: Situation[] = [];

    checkedSituations: number[] = [];

    nbRowsPerPage = 11;

    constructor(
        private router: Router,
        private apiSituation: SituationService,
        public commonService: CommonService,
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

}
