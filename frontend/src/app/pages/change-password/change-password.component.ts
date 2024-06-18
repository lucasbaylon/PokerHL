import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonService } from '../../services/common.service';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-change-password',
    standalone: true,
    imports: [NgClass, FormsModule, InputTextModule],
    templateUrl: './change-password.component.html',
})
export class ChangePasswordComponent {

    constructor(
        private authService: AuthService,
        protected commonService: CommonService,
        private router: Router
    ) { }

    passwordFieldTypeOld: string = 'password';
    passwordFieldTypeNew: string = 'password';
    passwordFieldTypeConfirm: string = 'password';
    oldPassword: string = '';
    newPassword: string = '';
    newPasswordConfirmation: string = '';

   /**
   * Bascule la visibilité du champ de mot de passe.
   *
   * @param {string} field - Le champ dont la visibilité doit être basculée.
   *                         Peut être 'old', 'new' ou 'confirm'.
   */
    togglePasswordVisibility(field: string): void {
        const fields: { [key: string]: 'passwordFieldTypeOld' | 'passwordFieldTypeNew' | 'passwordFieldTypeConfirm' } = {
            old: 'passwordFieldTypeOld',
            new: 'passwordFieldTypeNew',
            confirm: 'passwordFieldTypeConfirm'
        };

        if (fields[field]) {
            const fieldType = fields[field];
            this[fieldType] = this[fieldType] === 'password' ? 'text' : 'password';
        }
    }

   /**
   * Change le mot de passe de l'utilisateur après avoir validé les champs nécessaires.
   *
   * @returns {void}
   */
    changePassword(): void {
        if (!this.oldPassword || !this.newPassword || !this.newPasswordConfirmation) {
            this.commonService.showSwalToast('Veuillez remplir tous les champs', 'error');
            return;
        }

        if (this.newPassword !== this.newPasswordConfirmation) {
            this.commonService.showSwalToast('Les mots de passe ne correspondent pas', 'error');
            return;
        }

        this.authService.reauthenticate(this.oldPassword)
            .then(() => this.authService.changePassword(this.newPassword))
            .then(() => {
                this.commonService.showSwalToast('Mot de passe changé avec succès !');
                this.router.navigate(['settings']);
            })
            .catch(error => {
                const errorMessage = this.getErrorMessage(error.code);
                this.commonService.showSwalToast(`Erreur : ${errorMessage}`, 'error');
            });
    }

   /**
   * Renvoie un message d'erreur correspondant au code d'erreur fourni.
   *
   * @param {string} errorCode - Le code d'erreur retourné par le service d'authentification.
   * @returns {string} - Le message d'erreur correspondant.
   */
    getErrorMessage(errorCode: string): string {
        const errorMessages: { [key: string]: string } = {
            'auth/wrong-password': 'Le mot de passe actuel est incorrect.',
            'auth/weak-password': 'Le nouveau mot de passe est trop faible.',
            'auth/requires-recent-login': 'Cette opération nécessite une connexion récente. Veuillez vous reconnecter et réessayer.'
        };

        return errorMessages[errorCode] || 'Une erreur est survenue. Veuillez réessayer.';
    }

}
