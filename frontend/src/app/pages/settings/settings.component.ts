import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import Swal from 'sweetalert2';
import { SituationService } from '../../services/situation.service';
import { Router } from '@angular/router';
import { UserParams } from '../../interfaces/user-params';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [FormsModule, InputSwitchModule, DropdownModule],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SettingsComponent {

    constructor(
        public authService: AuthService,
        private situationService: SituationService,
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
        const fileList = event.target.files;
        for (const file of fileList) {
            if (file) {
                // Vérifier le type de fichier
                if (file.type === 'application/zip' || file.type === 'application/x-compressed' || file.type === 'application/x-zip-compressed') {
                    const blob = new Blob([file], { type: 'application/zip' });

                    this.situationService.importZIPSituationsForUser(blob).subscribe({
                        next: (response) => {
                            console.log(`${response.count} fichier(s) importé(s)`);
                            Swal.fire({
                                position: 'top-end',
                                toast: true,
                                icon: 'success',
                                title: `<span style="font-size: 1.3vw;">${response.count} fichier(s) importé(s) avec succès !</span>`,
                                showConfirmButton: false,
                                width: 'auto',
                                timer: 2500
                            });
                        },
                        error: (error) => {
                            console.error('Erreur lors du téléchargement du fichier', error);
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
                } else if (file.type === 'application/json') {
                    // Traiter le fichier json
                    const blob = new Blob([file], { type: 'application/json' });
                    this.situationService.importJSONSituationsForUser(file.name, blob).subscribe({
                        next: (response) => {
                            console.log(`Fichier JSON téléchargé avec succès.`);
                            Swal.fire({
                                position: 'top-end',
                                toast: true,
                                icon: 'success',
                                title: `<span style="font-size: 1.3vw;">Fichier(s) importé(s) avec succès !</span>`,
                                showConfirmButton: false,
                                width: 'auto',
                                timer: 2500
                            });
                        },
                        error: (error) => {
                            console.error('Erreur lors du téléchargement du fichier JSON', error);
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
                } else {
                    // Afficher un message d'erreur pour les types de fichiers non pris en charge
                    console.error('Type de fichier non pris en charge. Veuillez sélectionner un fichier .zip ou .json.');
                }
            }
        }
        event.target.value = '';
    }

    onClickFileExport() {
        this.situationService.exportSituationsForUser();
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
