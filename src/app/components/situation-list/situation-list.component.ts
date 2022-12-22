import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Situation } from 'src/app/interfaces/situation';
import { SituationService } from 'src/app/services/situation.service';

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
        if(this.checkedSituations.indexOf(e.target.value) === -1) {
            this.checkedSituations.push(e.target.value);
        } else {
            let index = this.checkedSituations.indexOf(e.target.value);
            this.checkedSituations.splice(index, 1);
        }
    }

    onStartTrainingButton() {
        console.log(this.checkedSituations)
        this.router.navigate(['training', {situationList: JSON.stringify(this.checkedSituations)}]);
    }

}
