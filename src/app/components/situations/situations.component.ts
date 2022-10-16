import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-situations',
    templateUrl: './situations.component.html',
    styleUrls: ['./situations.component.scss']
})
export class SituationsComponent implements OnInit {

    constructor(private router: Router) { }

    ngOnInit(): void {
    }

    redirectToHome() {
        this.router.navigate(['home']);
    }

}
