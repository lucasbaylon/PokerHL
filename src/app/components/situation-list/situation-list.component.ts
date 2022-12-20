import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/services/common.service';
import { SituationService } from 'src/app/services/situation.service';

@Component({
    selector: 'app-situation-list',
    templateUrl: './situation-list.component.html',
    styleUrls: ['./situation-list.component.scss']
})
export class SituationListComponent implements OnInit {

    constructor(
        private router: Router,
        private apiSituation: SituationService,
        private apiCommon: CommonService
    ) { }

    ngOnInit(): void {
    }

    redirectTo(page: string) {
        this.router.navigate([page]);
    }

}
