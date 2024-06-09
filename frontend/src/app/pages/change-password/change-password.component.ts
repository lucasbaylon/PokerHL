import { NgClass } from '@angular/common';
import { Component} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [NgClass, FormsModule],
  
templateUrl: './change-password.component.html',
})
export class ChangePasswordComponent {

  constructor(
    // private authService: AuthService,
    // protected commonService: CommonService,
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
}
