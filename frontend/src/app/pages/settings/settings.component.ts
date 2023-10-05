import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})

export class SettingsComponent {

    constructor(
        public apiAuth: AuthService,
        private router: Router
    ) { }

    darkMode: boolean = false;

    displaySolutionOnError: boolean = true;

    highContrastCards: boolean = false;

    autoNameMultipleSituation: boolean = false;

    availableCardsStyles: any[] = [
        { name: 'Standard', code: 'default' },
        { name: 'Contraste', code: 'contrast' },
        // { name: 'Winamax', code: 'WNX' },
        // { name: 'Poker Star', code: 'PKS' },
        // { name: 'UniBet', code: 'UNB' },
    ];

    cardsStyle: { name: string, code: string } = { name: 'Standard', code: 'default' };

    availablePokerTableColors: any[] = [
        { name: 'Vert', code: 'green' },
        { name: 'Bleu', code: 'blue' },
        { name: 'Rouge', code: 'red' },
    ];

    pokerTableColor: { name: string, code: string } = { name: 'Vert', code: 'green'};

    ngOnInit() {
        const userParams = JSON.parse(localStorage.getItem('userParams')!);
        userParams.playmatColor ? this.pokerTableColor = this.availablePokerTableColors.find((color) => color.code === userParams.playmatColor)! : this.pokerTableColor = this.availablePokerTableColors[0];
        userParams.cardStyle ? this.cardsStyle = this.availableCardsStyles.find((style) => style.code === userParams.cardStyle)! : this.cardsStyle = this.availableCardsStyles[0];
    }

    redirectTo(page: string) {
        this.router.navigate([page]);
    }

    onChangeDropdownCardsStyle() {
        const userParams = JSON.parse(localStorage.getItem('userParams')!);
        userParams.cardStyle = this.cardsStyle.code;
        localStorage.setItem('userParams', JSON.stringify(userParams));
    }

    onChangeDropdownTableColor() {
        const userParams = JSON.parse(localStorage.getItem('userParams')!);
        userParams.playmatColor = this.pokerTableColor.code;
        localStorage.setItem('userParams', JSON.stringify(userParams));
    }

}
