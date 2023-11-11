import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserParams } from 'src/app/interfaces/user-params';
import { AuthService } from 'src/app/services/auth.service';
import { SituationService } from 'src/app/services/situation.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})

export class SettingsComponent {

    constructor(
        public apiAuth: AuthService,
        private apiSituation: SituationService,
        private router: Router
    ) { }

    darkMode: boolean = false;

    displaySolutionOnError: boolean = true;

    highContrastCards: boolean = false;

    autoNameMultipleSituation: boolean = false;

    availableCardsStyles: any[] = [
        { name: 'Standard', code: 'default' },
        { name: 'Contraste', code: 'contrast' },
    ];

    cardsStyle: { name: string, code: string } = { name: 'Standard', code: 'default' };

    availablePokerTableColors: any[] = [
        { name: 'Vert', code: 'green' },
        { name: 'Bleu', code: 'blue' },
        { name: 'Rouge', code: 'red' },
    ];

    pokerTableColor: { name: string, code: string } = { name: 'Vert', code: 'green' };

    ngOnInit() {
        const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
        userParams.playmatColor ? this.pokerTableColor = this.availablePokerTableColors.find((color) => color.code === userParams.playmatColor)! : this.pokerTableColor = this.availablePokerTableColors[0];
        userParams.cardStyle ? this.cardsStyle = this.availableCardsStyles.find((style) => style.code === userParams.cardStyle)! : this.cardsStyle = this.availableCardsStyles[0];
        userParams.displaySolution ? this.displaySolutionOnError = userParams.displaySolution : this.displaySolutionOnError = false;
        userParams.darkMode ? this.darkMode = userParams.darkMode : this.darkMode = false;
    }

    redirectTo(page: string) {
        this.router.navigate([page]);
    }

    onChangeDisplaySolutionOnError() {
        const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
        userParams.displaySolution = this.displaySolutionOnError;
        localStorage.setItem('userParams', JSON.stringify(userParams));
    }

    onChangeDarkMode() {
        const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
        userParams.darkMode = this.darkMode;
        localStorage.setItem('userParams', JSON.stringify(userParams));
    }

    onChangeDropdownCardsStyle() {
        const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
        userParams.cardStyle = this.cardsStyle.code;
        localStorage.setItem('userParams', JSON.stringify(userParams));
    }

    onChangeDropdownTableColor() {
        const userParams = JSON.parse(localStorage.getItem('userParams')!);
        userParams.playmatColor = this.pokerTableColor.code;
        localStorage.setItem('userParams', JSON.stringify(userParams));
    }

    onClickFileImport(event: any) {
        const file = event.target.files[0];

        if (file) {
            const blob = new Blob([file], { type: 'application/zip' });

            this.apiSituation.importSituationsForUser(blob).subscribe({
                next: (response) => {
                    console.log(`${response.count} fichier(s) importé(s)`);
                    Swal.fire({
                        position: 'top-end',
                        toast: true,
                        icon: 'success',
                        title: `<span style="font-size: 1.3vw;">${response.count} fichier(s) importé(s) !</span>`,
                        showConfirmButton: false,
                        width: 'auto',
                        timer: 2500
                    });
                },
                error: (error) => {
                    console.error('Échec de l\'import', error);
                    Swal.fire({
                        position: 'top-end',
                        toast: true,
                        icon: 'error',
                        title: '<span style="font-size: 1.3vw;">Échec de l\'import</span>',
                        showConfirmButton: false,
                        width: 'auto',
                        timer: 2500
                    });
                }
            });
        }
    }

    onClickFileExport() {
        this.apiSituation.exportSituationsForUser();
        Swal.fire({
            position: 'top-end',
            toast: true,
            icon: 'success',
            title: `<span style="font-size: 1.3vw;">Situations exportées !</span>`,
            showConfirmButton: false,
            width: 'auto',
            timer: 2500
        });
    }

}
