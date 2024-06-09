import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonService } from '../../services/common.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-change-password',
    standalone: true,
    imports: [NgClass, FormsModule],
    templateUrl: './change-password.component.html',
})
export class ChangePasswordComponent {

    constructor(
        private authService: AuthService,
        protected commonService: CommonService,
        private router: Router
    ) { }

    passwordFieldType: string = 'password';
    oldPassword: string = '';
    newPassword: string = '';
    newPasswordConfirmation: string = '';

    /**
     * Cette méthode change le type du champ de mot de passe entre 'password' et 'text',
     * permettant de masquer ou afficher le mot de passe.
     */
    togglePasswordVisibility(): void {
        this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
    }

    changePassword() {
        if (!this.oldPassword || !this.newPassword || !this.newPasswordConfirmation) {
            this.commonService.showSwalToast('Veuillez remplir tous les champs', 'error');
            return;
        }

        if (this.newPassword !== this.newPasswordConfirmation) {
            this.commonService.showSwalToast('Les mots de passe ne correspondent pas', 'error');
            return;
        }

        this.authService.reauthenticate(this.oldPassword).then(() => {
            return this.authService.changePassword(this.newPassword).then(() => {
                this.commonService.showSwalToast(`Mot de passe changé avec succès !`);
                this.router.navigate(['settings']);
            })
            .catch((error) => {
                let errorMessage = this.getErrorMessage(error.code);
                this.commonService.showSwalToast(`Échec du changement de mot de passe: ${errorMessage}`, 'error');
            });
        }).catch(error => {
            let errorMessage = this.getErrorMessage(error.code);
            this.commonService.showSwalToast(`Échec du changement de mot de passe: ${errorMessage}`, 'error');
        });
    }

    getErrorMessage(errorCode: string): string {
        switch (errorCode) {
            case 'auth/wrong-password':
                return 'Le mot de passe actuel est incorrect.';
            case 'auth/weak-password':
                return 'Le nouveau mot de passe est trop faible.';
            case 'auth/requires-recent-login':
                return 'Cette opération nécessite une connexion récente. Veuillez vous reconnecter et réessayer.';
            default:
                return 'Une erreur est survenue. Veuillez réessayer.';
        }
    }
}
