import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Situation } from '../../interfaces/situation';

@Component({
    selector: 'app-select-training-mode',
    standalone: true,
    imports: [],
    templateUrl: './select-training-mode.component.html'
})
export class SelectTrainingModeComponent {

    situationList: Situation[] = [];

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute
    ) { }

    ngOnInit() {
        if (this.activatedRoute.snapshot.params.hasOwnProperty('situationList')) {
            this.situationList = JSON.parse(this.activatedRoute.snapshot.params['situationList']);
            const currentUrl = this.router.url;
            const baseUrl = currentUrl.split(';')[0];
            this.router.navigateByUrl(baseUrl);
        }
    }

    test() {
        console.log(this.situationList);
    }

}
