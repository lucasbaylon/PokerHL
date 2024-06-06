import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LoginComponent {

    constructor(private authService: AuthService, private router: Router) { }

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

    redirectTo(page: string) {
        this.router.navigate([page]);
    }

}
