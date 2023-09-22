import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {

  constructor(
    private router: Router
  ) { }

  darkMode: boolean = false;
  displaySolutionOnError: boolean = true;
  highContrastCards: boolean = false;
  checked: boolean = false;

  redirectTo(page: string) {
    this.router.navigate([page]);
  }

}
