import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  eyeIcon: string = 'eye-outline';
  inputType: string = 'password';

  toggleEyeIcon(): void {
    if (this.eyeIcon === 'eye-outline') {
      this.eyeIcon = 'eye-off-outline';
      this.inputType = 'text';
    } else {
      this.eyeIcon = 'eye-outline';
      this.inputType = 'password';
    }
  }

}
