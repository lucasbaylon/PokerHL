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
    templateUrl: './settings.component.html'
})
export class SettingsComponent {

    constructor(
        protected apiAuth: AuthService,
        private apiSituation: SituationService,
        protected commonService: CommonService
    ) { }

    darkMode: boolean = false;
    showParticules: boolean = false;
    displaySolutionOnError: boolean = true;
    highContrastCards: boolean = false;
    autoMultipleSolutionName: boolean = false;

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
        userParams.autoMultipleSolutionName ? this.autoMultipleSolutionName = userParams.autoMultipleSolutionName : this.autoMultipleSolutionName = false;
        userParams.showParticules ? this.showParticules = userParams.showParticules : this.showParticules = false;
        localStorage.getItem('theme') === 'light' ? this.darkMode = false : this.darkMode = true;
    }

    /**
    * Bascule le mode sombre et met à jour le thème dans le localStorage.
    *
    * @returns {void}
    */
    toggleDarkMode(): void {
        const htmlElement = document.documentElement;
        this.darkMode ? htmlElement.classList.add('dark') : htmlElement.classList.remove('dark');
        localStorage.setItem('theme', this.darkMode ? "dark" : "light");
    }

    /**
    * Bascule l'activation des particules et met à jour le paramètre utilisateur dans le localStorage.
    *
    * @returns {void}
    */
    toggleShowParticules(): void {
        this.commonService.setShowParticule(this.showParticules);
        this.updateUserParam('showParticules', this.showParticules);
    }

    /**
    * Met à jour un paramètre utilisateur dans le localStorage.
    *
    * @param {keyof UserParams} key - La clé du paramètre utilisateur à mettre à jour.
    * @param {UserParams[keyof UserParams]} value - La nouvelle valeur du paramètre utilisateur.
    * @returns {void}
    */
    updateUserParam<K extends keyof UserParams>(key: K, value: UserParams[K]): void {
        const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
        userParams[key] = value;
        localStorage.setItem('userParams', JSON.stringify(userParams));
    }

    /**
    * Fonction déclenchée lors du clic pour importer des situations.
    * Cette fonction traite les fichiers sélectionnés par l'utilisateur et les importe
    * via l'API, en fonction de leur type (ZIP ou JSON).
    *
    * @param {Event} event - L'événement de sélection de fichiers.
    */
    onClickFileImport(event: any) {
        const fileList = event.target.files;

        const handleFileImport = (file: File, type: string) => {
            const blob = new Blob([file], { type });

            let importObservable;
            if (type === 'application/zip') {
                importObservable = this.apiSituation.importZIPSituationsForUser(blob);
            } else if (type === 'application/json') {
                importObservable = this.apiSituation.importJSONSituationsForUser(file.name, blob);
            } else {
                console.error('Type de fichier non pris en charge. Veuillez sélectionner un fichier zip ou json.');
                this.commonService.showSwalToast(`Veuillez sélectionner un fichier zip ou json.`, 'error');
                return;
            }

            importObservable.subscribe({
                next: (response) => {
                    console.log(`${response.count} fichier(s) importé(s)`);
                    this.commonService.showSwalToast(`${response.count} fichier(s) importé(s) avec succès !`);
                },
                error: (error) => {
                    console.error('Erreur lors du téléchargement du fichier', error);
                    this.commonService.showSwalToast(`Échec de l'import`, 'error');
                }
            });
        };

        for (const file of fileList) {
            if (file) {
                if (file.type === 'application/zip' || file.type === 'application/x-compressed' || file.type === 'application/x-zip-compressed') {
                    handleFileImport(file, 'application/zip');
                } else if (file.type === 'application/json') {
                    handleFileImport(file, 'application/json');
                } else {
                    console.error('Type de fichier non pris en charge. Veuillez sélectionner un fichier zip ou json.');
                }
            }
        }

        event.target.value = '';
    }


    /**
    * Fonction déclenchée lors du clic pour exporter les situations.
    * Cette fonction appelle l'API pour exporter les situations de l'utilisateur,
    * puis affiche un message toast pour indiquer que l'exportation a réussi.
    */
    onClickFileExport() {
        this.apiSituation.exportSituationsForUser();
        this.commonService.showSwalToast(`Situations exportées !`);
    }
}
