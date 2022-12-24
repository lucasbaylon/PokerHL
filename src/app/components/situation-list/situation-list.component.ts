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

    redirectToHome() {
        this.router.navigate(['home']);
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
                position: 'top-end',
                icon: 'warning',
                title: 'Veuillez sélectionné au moins une situation.',
                showConfirmButton: false,
                backdrop: false,
                timer: 1500
              });
        } else {
            this.router.navigate(['training', { situationList: JSON.stringify(this.checkedSituations) }]);
        }
    }

}
