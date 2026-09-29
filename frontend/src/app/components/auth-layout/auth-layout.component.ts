import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-auth-layout',
    standalone: true,
    templateUrl: './auth-layout.component.html'
})
export class AuthLayoutComponent {
    /** Titre de la page (en-tête principal). */
    @Input({ required: true }) title!: string;
    @Input() subtitle = '';
    /** En-tête de la carte contenant le formulaire. */
    @Input({ required: true }) cardTitle!: string;
    @Input() cardSubtitle = '';
    /** Icône Font Awesome de la carte (ex. 'fa-right-to-bracket'). */
    @Input() cardIcon = 'fa-user';

    /** Points forts de l'application, affichés dans le panneau de gauche (écrans ≥ 1024 px). */
    readonly features = [
        { icon: 'fa-layer-group', title: 'Situations', description: 'Créez vos spots pré-flop et flop, puis peignez vos ranges.' },
        { icon: 'fa-play', title: 'Entraînement', description: 'Quatre modes : infini, turbo, survie et défi.' },
        { icon: 'fa-table-cells-large', title: 'Grille', description: 'Composez des pages de ranges à consulter en un coup d\'œil.' },
        { icon: 'fa-book', title: 'Lexique', description: 'Tout le vocabulaire du poker, expliqué simplement.' }
    ];
}
