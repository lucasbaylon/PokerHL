import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {

    constructor(private authService: AuthService) { }

    eyeIcon: string = 'eye-outline';
    inputType: string = 'password';

    email: string = '';
    password: string = '';

    toggleEyeIcon(): void {
        if (this.eyeIcon === 'eye-outline') {
            this.eyeIcon = 'eye-off-outline';
            this.inputType = 'text';
        } else {
            this.eyeIcon = 'eye-outline';
            this.inputType = 'password';
        }
    }

    login(): void {
        if (this.email && this.password) this.authService.signIn(this.email, this.password);
    }

}
