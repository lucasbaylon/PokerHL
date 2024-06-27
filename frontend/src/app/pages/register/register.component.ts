import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../services/auth.service';
import { CommonService } from '../../services/common.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [FormsModule, NgClass, InputTextModule],
    templateUrl: './register.component.html'
})
export class RegisterComponent {

    passwordFieldType: string = 'password';
    passwordFieldTypeConfirm: string = 'password';
    displayName: string = '';
    email: string = '';
    password: string = '';
    passwordConfirmation: string = '';

    constructor(
        private authService: AuthService,
        private commonService: CommonService
    ) { }

    /**
     * Bascule la visibilité du champ de mot de passe.
     *
     * @param {string} field Le champ dont la visibilité doit être basculée. Peut être 'old', 'new' ou 'confirm'.
     */
    togglePasswordVisibility(field: string): void {
        const fields: { [key: string]: 'passwordFieldType' | 'passwordFieldTypeConfirm' } = {
            new: 'passwordFieldType',
            confirm: 'passwordFieldTypeConfirm'
        };

        if (fields[field]) {
            const fieldType = fields[field];
            this[fieldType] = this[fieldType] === 'password' ? 'text' : 'password';
        }
    }

    /**
    * Cette méthode vérifie si l'email et le mot de passe sont renseignés,
    * puis appelle le service d'authentification pour se connecter avec ces informations.
    */
    register(): void {
        if (!this.displayName || !this.email || !this.password || !this.passwordConfirmation) {
            this.commonService.showSwalToast('Veuillez remplir tous les champs.', 'error');
            return;
        }

        if (this.password !== this.passwordConfirmation) {
            this.commonService.showSwalToast('Les mots de passe ne correspondent pas.', 'error');
            return;
        }

        this.authService.signUp(this.email, this.password, this.displayName);
    }

}
