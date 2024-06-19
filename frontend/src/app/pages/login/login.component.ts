import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CommonService } from '../../services/common.service';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, InputTextModule],
    templateUrl: './login.component.html',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LoginComponent {

    constructor(
        private authService: AuthService,
        protected commonService: CommonService,
    ) { }

    passwordFieldType: string = 'password';
    email: string = '';
    password: string = '';

    /**
    * Cette méthode change le type du champ de mot de passe entre 'password' et 'text',
    * permettant de masquer ou afficher le mot de passe.
    */
    togglePasswordVisibility(): void {
        this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
    }

    /**
    * Cette méthode vérifie si l'email et le mot de passe sont renseignés,
    * puis appelle le service d'authentification pour se connecter avec ces informations.
    */
    login(): void {
        if (this.email && this.password) this.authService.signIn(this.email, this.password);
    }
}
