import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SituationService } from 'src/app/services/situation.service';
import { Situation } from 'src/app/interfaces/situation';

@Component({
    selector: 'app-manage-situation',
    templateUrl: './manage-situation.component.html',
    styleUrls: ['./manage-situation.component.scss']
})
export class ManageSituationComponent implements OnInit {

    situationList: Situation[] = [];

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

}
