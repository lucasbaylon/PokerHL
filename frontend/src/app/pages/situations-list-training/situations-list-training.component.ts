import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { Situation } from '../../interfaces/situation';
import { DealerPipe } from '../../pipes/dealer.pipe';
import { OpponentLevelPipe } from '../../pipes/opponent-level.pipe';
import { PositionPipe } from '../../pipes/position.pipe';
import { TypePipe } from '../../pipes/type.pipe';
import { CommonService } from '../../services/common.service';
import { SituationService } from '../../services/situation.service';

@Component({
    selector: 'app-situations-list-training',
    standalone: true,
    imports: [TableModule, DealerPipe, OpponentLevelPipe, PositionPipe, TypePipe, MultiSelectModule, FormsModule],
    templateUrl: './situations-list-training.component.html'
})
export class SituationsListTrainingComponent {

    situationList: Situation[] = [];

    selectedSituations: Situation[] = [];

    checkedSituations: number[] = [];

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
        public commonService: CommonService,
    ) { }

    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        this.nbRowsPerPage = this.commonService.getNbRowsPerPage(event.target.innerHeight);
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

    redirectTo(page: string) {
        this.router.navigate([page]);
    }

    onStartTrainingButton() {
        if (this.selectedSituations.length === 0) {
            this.commonService.showSwalToast('Veuillez sélectionner au moins une situation.', 'error');
        } else {
            this.router.navigate(['select-training-mode', { situationList: JSON.stringify(this.selectedSituations) }]);
        }
    }

}
