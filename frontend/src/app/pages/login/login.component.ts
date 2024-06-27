import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../services/auth.service';
import { CommonService } from '../../services/common.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [FormsModule, InputTextModule, NgClass],
    templateUrl: './login.component.html'
})
export class LoginComponent {

    passwordFieldType: string = 'password';
    email: string = '';
    password: string = '';

    constructor(
        private authService: AuthService,
        protected commonService: CommonService,
    ) { }

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
