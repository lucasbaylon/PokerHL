import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, InputTextModule],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {

  email: string = "";

  constructor(
    private authService: AuthService,
    private router: Router,
    protected commonService: CommonService) { }

  /**
  * Envoie un email de réinitialisation de mot de passe à l'utilisateur et redirige vers la page de connexion.
  * Affiche un message de succès ou d'erreur selon le résultat de l'opération.
  */
  resetPassword(): void {
    this.authService.sendPasswordResetEmail(this.email)
      .then(() => {
        this.commonService.showSwalToast('Email de réinitialisation envoyé !', 'success');
        this.router.navigate(['login']);
      })
      .catch(error => {
        const errorMessage = this.commonService.getErrorMessage(error.code);
        this.commonService.showSwalToast(`Échec de l'envoi de l'email : ${errorMessage}`, 'error');
      });
  }
}
