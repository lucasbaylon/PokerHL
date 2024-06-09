import { Component } from '@angular/core';
import { CommonService } from '../../services/common.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [],
    templateUrl: './home.component.html'
})
export class HomeComponent {

    constructor(
        protected commonService: CommonService,
    ) { }

}
