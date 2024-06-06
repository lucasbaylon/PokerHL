import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './forgot-password.component.html',
    styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {

    email: string = "";

    constructor(private authService: AuthService, private router: Router) { }

    resetpassword() {
        this.authService.sendPasswordResetEmail(this.email).then(() => this.router.navigate(["login"]));
    }

}
