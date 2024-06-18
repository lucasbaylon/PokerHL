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
   */
    changePassword(): void {
        if (!this.oldPassword || !this.newPassword || !this.newPasswordConfirmation) {
            this.commonService.showSwalToast('Veuillez remplir tous les champs.', 'error');
            return;
        }

        if (this.newPassword !== this.newPasswordConfirmation) {
            this.commonService.showSwalToast('Les nouveaux mots de passe ne correspondent pas.', 'error');
            return;
        }

        this.authService.reauthenticate(this.oldPassword)
            .then(() => this.authService.changePassword(this.newPassword))
            .then(() => {
                this.commonService.showSwalToast('Mot de passe changé avec succès !');
                this.router.navigate(['settings']);
            })
            .catch(error => {
                const errorMessage = this.commonService.getErrorMessage(error.code);
                this.commonService.showSwalToast(`Erreur : ${errorMessage}`, 'error');
            });
    }

}
