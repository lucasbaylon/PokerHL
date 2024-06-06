import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LoginComponent {

    constructor(private authService: AuthService) { }

    passwordFieldType: string = 'password';
    email: string = '';
    password: string = '';

    togglePasswordVisibility(): void {
        this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
    }

    login(): void {
        if (this.email && this.password) this.authService.signIn(this.email, this.password);
    }

}
