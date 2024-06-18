import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener } from '@angular/core';
import { SituationService } from '../../services/situation.service';
import { Router } from '@angular/router';
import { Situation } from '../../interfaces/situation';
import { TableModule } from 'primeng/table';
import { DealerPipe } from '../../pipes/dealer.pipe';
import { OpponentLevelPipe } from '../../pipes/opponent-level.pipe';
import { PositionPipe } from '../../pipes/position.pipe';
import { CommonService } from '../../services/common.service';
import { TypePipe } from '../../pipes/type.pipe';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-situations-list-training',
    standalone: true,
    imports: [TableModule, DealerPipe, OpponentLevelPipe, PositionPipe, TypePipe, MultiSelectModule, FormsModule],
    templateUrl: './situations-list-training.component.html',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SituationsListTrainingComponent {

    situationList: Situation[] = [];

    selectedSituations: Situation[] = [];

    checkedSituations: number[] = [];

    nbRowsPerPage = 11;

    opponentLevelLst = [
        { name: 'Débutant', value: "fish" },
        { name: 'Confirmé', value: "shark" },
        { name: 'Débutant/Confirmé', value: "fish_shark" }
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
