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
  availableCardsStyles: any[] = [];
  cardsStyle: any;
  availablePokerTableColors: any[] = [];
  pokerTableColor: any;

  ngOnInit() {
    this.availableCardsStyles = [
      { name: 'Standard', code: 'STD' },
      { name: 'Contraste', code: 'CTR' },
      { name: 'Winamax', code: 'WNX' },
      { name: 'Poker Star', code: 'PKS' },
      { name: 'UniBet', code: 'UNB' },
    ];

    this.availablePokerTableColors = [
      { name: 'Vert', code: 'VRT' },
      { name: 'Bleu', code: 'BLU' },
      { name: 'Rouge', code: 'RGU' },
      { name: 'Noir', code: 'NOR' },
    ];
  }

  redirectTo(page: string) {
    this.router.navigate([page]);
  }

}
