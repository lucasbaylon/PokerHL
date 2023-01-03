import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Situation } from 'src/app/interfaces/situation';
import { SituationService } from 'src/app/services/situation.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-situation-list',
    templateUrl: './situation-list.component.html',
    styleUrls: ['./situation-list.component.scss']
})
export class SituationListComponent implements OnInit {

    situationList: Situation[] = [];

    checkedSituations: number[] = [];

    constructor(
        private router: Router,
        private apiSituation: SituationService
    ) { }

    ngOnInit(): void {
        this.apiSituation.situations.subscribe(data => {
            this.situationList = data;
        });

        this.apiSituation.getSituations();
    }

    redirectTo(page: string) {
        this.router.navigate([page]);
    }

    onCheckedSituationCheckbox(e: any) {
        if (this.checkedSituations.indexOf(e.target.value) === -1) {
            this.checkedSituations.push(e.target.value);
        } else {
            let index = this.checkedSituations.indexOf(e.target.value);
            this.checkedSituations.splice(index, 1);
        }
    }

    onStartTrainingButton() {
        if (this.checkedSituations.length === 0) {
            Swal.fire({
                icon: 'error',
                html: '<h1 style="font-family: \'Lato\', sans-serif; margin-top:-10px;">Erreur !</h1><p style="font-family: \'Lato\', sans-serif; margin-bottom:0; font-size: 1.2em;">Veuillez sélectionner au moins une situation.</p>',
                confirmButtonColor: '#d74c4c',
                confirmButtonText: '<p style="font-family: \'Lato\', sans-serif; margin-top:0; margin-bottom:0; font-size: 1.1em; font-weight: 600;">C\'est compris !</p>'
            })
        } else {
            this.router.navigate(['training', { situationList: JSON.stringify(this.checkedSituations) }]);
        }
    }

}
