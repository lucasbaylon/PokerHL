import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../services/auth.service';
import { CommonService } from '../../services/common.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [FormsModule, InputTextModule],
    templateUrl: './login.component.html'
})
export class LoginComponent {

    passwordFieldType: 'password' | 'text' = 'password';
    email: string = '';
    password: string = '';
    isSubmitting: boolean = false;

    /**
     * Initialise le composant.
     */
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
        if (!this.email || !this.password) {
            this.commonService.showSwalToast('Veuillez renseigner votre email et votre mot de passe.', 'error');
            return;
        }

        if (this.isSubmitting) return;
        this.isSubmitting = true;
        this.authService.signIn(this.email, this.password)
            .finally(() => this.isSubmitting = false);
    }
}
