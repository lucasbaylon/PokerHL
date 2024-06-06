import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LoginComponent {

    eyeIcon: string = 'eye-outline';
    inputType: string = 'password';

    email: string = '';
    password: string = '';

    constructor(private authService: AuthService) { }

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
