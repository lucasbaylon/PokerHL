import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {

    constructor(private router: Router, private apiAuth: AuthService) { }

    ngOnInit() {
        console.log(this.apiAuth.isLoggedIn());
    }

    redirectTo(page: string) {
        this.router.navigate([page]);
    }

}
