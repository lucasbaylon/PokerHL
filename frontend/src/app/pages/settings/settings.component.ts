import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { SituationService } from '../../services/situation.service';
import { UserParams } from '../../interfaces/user-params';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CommonService } from './../../services/common.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [DropdownModule, InputSwitchModule, FormsModule],
    templateUrl: './settings.component.html',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SettingsComponent {

    constructor(
        protected apiAuth: AuthService,
        private apiSituation: SituationService,
        protected commonService: CommonService
    ) { }

    darkMode: boolean = false;
    displaySolutionOnError: boolean = true;
    highContrastCards: boolean = false;
    autoNameMultipleSituation: boolean = false;

    availableCardsStyles: any[] = [
        { name: 'Standard', code: 'default' },
        { name: 'Contraste', code: 'contrast' },
    ];
    
    availablePokerTableColors: any[] = [
        { name: 'Vert', code: 'green' },
        { name: 'Bleu', code: 'blue' },
        { name: 'Rouge', code: 'red' },
    ];

    cardsStyle: { name: string, code: string } = this.availableCardsStyles[0];
    pokerTableColor: { name: string, code: string } = this.availablePokerTableColors[0];

    ngOnInit() {
        const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
        userParams.playmatColor ? this.pokerTableColor = this.availablePokerTableColors.find((color) => color.code === userParams.playmatColor)! : this.pokerTableColor = this.availablePokerTableColors[0];
        userParams.cardStyle ? this.cardsStyle = this.availableCardsStyles.find((style) => style.code === userParams.cardStyle)! : this.cardsStyle = this.availableCardsStyles[0];
        userParams.displaySolution ? this.displaySolutionOnError = userParams.displaySolution : this.displaySolutionOnError = false;
        localStorage.getItem('theme') === 'light' ? this.darkMode = false : this.darkMode = true;
    }

    onChangeDisplaySolutionOnError() {
        const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
        userParams.displaySolution = this.displaySolutionOnError;
        localStorage.setItem('userParams', JSON.stringify(userParams));
    }

    onChangeDarkMode() {
        const htmlElement = document.documentElement;
        this.darkMode ? htmlElement.classList.add('dark') : htmlElement.classList.remove('dark');
        localStorage.setItem('theme', this.darkMode ? "dark" : "light");
    }

    onChangeDropdownCardsStyle(e: any) {
        const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
        userParams.cardStyle = e.value.code;
        localStorage.setItem('userParams', JSON.stringify(userParams));
    }

    onChangeDropdownTableColor(e: any) {
        console.log(e);
        const userParams = JSON.parse(localStorage.getItem('userParams')!);
        userParams.playmatColor = e.value.code;
        localStorage.setItem('userParams', JSON.stringify(userParams));
    }

    onClickFileImport(event: any) {
        console.log("test");
        const fileList = event.target.files;
        for (const file of fileList) {
            if (file) {
                // Vérifier le type de fichier
                if (file.type === 'application/zip' || file.type === 'application/x-compressed' || file.type === 'application/x-zip-compressed') {
                    const blob = new Blob([file], { type: 'application/zip' });

                    this.apiSituation.importZIPSituationsForUser(blob).subscribe({
                        next: (response) => {
                            console.log(`${response.count} fichier(s) importé(s)`);
                            this.commonService.showSwalToast(`${response.count} fichier(s) importé(s) avec succès !`);
                        },
                        error: (error) => {
                            console.error('Erreur lors du téléchargement du fichier', error);
                            this.commonService.showSwalToast(`Échec de l\'import`, 'error');
                        }
                    });
                } else if (file.type === 'application/json') {
                    // Traiter le fichier json
                    const blob = new Blob([file], { type: 'application/json' });
                    this.apiSituation.importJSONSituationsForUser(file.name, blob).subscribe({
                        next: (response) => {
                            console.log(`Fichier JSON téléchargé avec succès.`);
                            this.commonService.showSwalToast(`Fichier(s) importé(s) avec succès !`);
                        },
                        error: (error) => {
                            console.error('Erreur lors du téléchargement du fichier JSON', error);
                            this.commonService.showSwalToast(`Échec de l\'import`, 'error');
                        }
                    });
                } else {
                    // Afficher un message d'erreur pour les types de fichiers non pris en charge
                    console.error('Type de fichier non pris en charge. Veuillez sélectionner un fichier zip ou json.');
                }
            }
        }
        event.target.value = '';
    }

    onClickFileExport() {
        this.apiSituation.exportSituationsForUser();
        this.commonService.showSwalToast(`Situations exportées !`);
    }
}
