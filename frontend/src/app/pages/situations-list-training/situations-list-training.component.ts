import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Situation } from 'src/app/interfaces/situation';
import { SituationService } from 'src/app/services/situation.service';
import Swal from 'sweetalert2';
import { Paginator } from 'primeng/paginator';

@Component({
    selector: 'app-situations-list-training',
    templateUrl: './situations-list-training.component.html',
    styleUrls: ['./situations-list-training.component.scss']
})
export class SituationsListTrainingComponent {

    situationList: Situation[] = [];

    selectedSituations: Situation[] = [];

    checkedSituations: number[] = [];

    nbRowsPerPage = 10;

    pageNumber = this.paginator.currentPage();

    constructor(
        private router: Router,
        private apiSituation: SituationService,
        private paginator: Paginator
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
            Swal.fire({
                icon: 'error',
                html: '<h1 style="font-family: \'Lato\', sans-serif; margin-top:-10px;">Erreur !</h1><p style="font-family: \'Lato\', sans-serif; margin-bottom:0; font-size: 1.2em;">Veuillez sélectionner au moins une situation.</p>',
                confirmButtonColor: '#d74c4c',
                confirmButtonText: '<p style="font-family: \'Lato\', sans-serif; margin-top:0; margin-bottom:0; font-size: 1.1em; font-weight: 600;">C\'est compris !</p>'
            })
        } else {
            this.router.navigate(['training', { situationList: JSON.stringify(this.selectedSituations) }]);
        }
    }

}
