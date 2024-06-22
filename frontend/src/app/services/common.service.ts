import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Situation } from '../interfaces/situation';
import { Solution } from '../interfaces/solution';

@Injectable({
    providedIn: 'root'
})
export class CommonService {

    private showParticules = signal<boolean>(false);
    private darkMode = signal<boolean>(false);

    constructor(
        private router: Router
    ) { }

    public isCollapsed: boolean = false;
    empty_situation_obj: Situation = {
        id: undefined,
        name: undefined,
        type: "preflop",
        nbPlayer: 3,
        stack: 0,
        position: "sb",
        opponentLevel: "fish",
        fishPosition: undefined,
        solutions: [
            {
                id: "unique_solution_0",
                type: "unique",
                display_name: "All In",
                color: "#d80c05"
            },
            {
                id: "unique_solution_1",
                type: "unique",
                display_name: "Call",
                color: "#00aeff"
            },
            {
                id: "unique_solution_2",
                type: "unique",
                display_name: "Check",
                color: "#96c582"
            }
        ],
        situations: [
            [{ card: "AA", solution: undefined }, { card: "AKs", solution: undefined }, { card: "AQs", solution: undefined }, { card: "AJs", solution: undefined }, { card: "ATs", solution: undefined }, { card: "A9s", solution: undefined }, { card: "A8s", solution: undefined }, { card: "A7s", solution: undefined }, { card: "A6s", solution: undefined }, { card: "A5s", solution: undefined }, { card: "A4s", solution: undefined }, { card: "A3s", solution: undefined }, { card: "A2s", solution: undefined }],
            [{ card: "AKo", solution: undefined }, { card: "KK", solution: undefined }, { card: "KQs", solution: undefined }, { card: "KJs", solution: undefined }, { card: "KTs", solution: undefined }, { card: "K9s", solution: undefined }, { card: "K8s", solution: undefined }, { card: "K7s", solution: undefined }, { card: "K6s", solution: undefined }, { card: "K5s", solution: undefined }, { card: "K4s", solution: undefined }, { card: "K3s", solution: undefined }, { card: "K2s", solution: undefined }],
            [{ card: "AQo", solution: undefined }, { card: "KQo", solution: undefined }, { card: "QQ", solution: undefined }, { card: "QJs", solution: undefined }, { card: "QTs", solution: undefined }, { card: "Q9s", solution: undefined }, { card: "Q8s", solution: undefined }, { card: "Q7s", solution: undefined }, { card: "Q6s", solution: undefined }, { card: "Q5s", solution: undefined }, { card: "Q4s", solution: undefined }, { card: "Q3s", solution: undefined }, { card: "Q2s", solution: undefined }],
            [{ card: "AJo", solution: undefined }, { card: "KJo", solution: undefined }, { card: "QJo", solution: undefined }, { card: "JJ", solution: undefined }, { card: "JTs", solution: undefined }, { card: "J9s", solution: undefined }, { card: "J8s", solution: undefined }, { card: "J7s", solution: undefined }, { card: "J6s", solution: undefined }, { card: "J5s", solution: undefined }, { card: "J4s", solution: undefined }, { card: "J3s", solution: undefined }, { card: "J2s", solution: undefined }],
            [{ card: "ATo", solution: undefined }, { card: "KTo", solution: undefined }, { card: "QTo", solution: undefined }, { card: "JTo", solution: undefined }, { card: "TT", solution: undefined }, { card: "T9s", solution: undefined }, { card: "T8s", solution: undefined }, { card: "T7s", solution: undefined }, { card: "T6s", solution: undefined }, { card: "T5s", solution: undefined }, { card: "T4s", solution: undefined }, { card: "T3s", solution: undefined }, { card: "T2s", solution: undefined }],
            [{ card: "A9o", solution: undefined }, { card: "K9o", solution: undefined }, { card: "Q9o", solution: undefined }, { card: "J9o", solution: undefined }, { card: "T9o", solution: undefined }, { card: "99", solution: undefined }, { card: "98s", solution: undefined }, { card: "97s", solution: undefined }, { card: "96s", solution: undefined }, { card: "95s", solution: undefined }, { card: "94s", solution: undefined }, { card: "93s", solution: undefined }, { card: "92s", solution: undefined }],
            [{ card: "A8o", solution: undefined }, { card: "K8o", solution: undefined }, { card: "Q8o", solution: undefined }, { card: "J8o", solution: undefined }, { card: "T8o", solution: undefined }, { card: "98o", solution: undefined }, { card: "88", solution: undefined }, { card: "87s", solution: undefined }, { card: "86s", solution: undefined }, { card: "85s", solution: undefined }, { card: "84s", solution: undefined }, { card: "83s", solution: undefined }, { card: "82s", solution: undefined }],
            [{ card: "A7o", solution: undefined }, { card: "K7o", solution: undefined }, { card: "Q7o", solution: undefined }, { card: "J7o", solution: undefined }, { card: "T7o", solution: undefined }, { card: "97o", solution: undefined }, { card: "87o", solution: undefined }, { card: "77", solution: undefined }, { card: "76s", solution: undefined }, { card: "75s", solution: undefined }, { card: "74s", solution: undefined }, { card: "73s", solution: undefined }, { card: "72s", solution: undefined }],
            [{ card: "A6o", solution: undefined }, { card: "K6o", solution: undefined }, { card: "Q6o", solution: undefined }, { card: "J6o", solution: undefined }, { card: "T6o", solution: undefined }, { card: "96o", solution: undefined }, { card: "86o", solution: undefined }, { card: "76o", solution: undefined }, { card: "66", solution: undefined }, { card: "65s", solution: undefined }, { card: "64s", solution: undefined }, { card: "63s", solution: undefined }, { card: "62s", solution: undefined }],
            [{ card: "A5o", solution: undefined }, { card: "K5o", solution: undefined }, { card: "Q5o", solution: undefined }, { card: "J5o", solution: undefined }, { card: "T5o", solution: undefined }, { card: "95o", solution: undefined }, { card: "85o", solution: undefined }, { card: "75o", solution: undefined }, { card: "65o", solution: undefined }, { card: "55", solution: undefined }, { card: "54s", solution: undefined }, { card: "53s", solution: undefined }, { card: "52s", solution: undefined }],
            [{ card: "A4o", solution: undefined }, { card: "K4o", solution: undefined }, { card: "Q4o", solution: undefined }, { card: "J4o", solution: undefined }, { card: "T4o", solution: undefined }, { card: "94o", solution: undefined }, { card: "84o", solution: undefined }, { card: "74o", solution: undefined }, { card: "64o", solution: undefined }, { card: "54o", solution: undefined }, { card: "44", solution: undefined }, { card: "43s", solution: undefined }, { card: "42s", solution: undefined }],
            [{ card: "A3o", solution: undefined }, { card: "K3o", solution: undefined }, { card: "Q3o", solution: undefined }, { card: "J3o", solution: undefined }, { card: "T3o", solution: undefined }, { card: "93o", solution: undefined }, { card: "83o", solution: undefined }, { card: "73o", solution: undefined }, { card: "63o", solution: undefined }, { card: "53o", solution: undefined }, { card: "43o", solution: undefined }, { card: "33", solution: undefined }, { card: "32s", solution: undefined }],
            [{ card: "A2o", solution: undefined }, { card: "K2o", solution: undefined }, { card: "Q2o", solution: undefined }, { card: "J2o", solution: undefined }, { card: "T2o", solution: undefined }, { card: "92o", solution: undefined }, { card: "82o", solution: undefined }, { card: "72o", solution: undefined }, { card: "62o", solution: undefined }, { card: "52o", solution: undefined }, { card: "42o", solution: undefined }, { card: "32o", solution: undefined }, { card: "22", solution: undefined }]
        ]
    }

    /**
     * Crée un dégradé linéaire pour l'arrière-plan d'une cellule en fonction du type de solution (unique ou mixte) et des couleurs associées.
     * @param solution La solution pour laquelle l'arrière-plan est généré.
     * @param solutionLst La liste des solutions pour récupérer les couleurs associées.
     * @returns La chaîne CSS représentant le dégradé de l'arrière-plan de la cellule.
     */
    cellBackground(solution: Solution, solutionLst: Solution[]) {
        if (solution.type === "unique") {
            return `linear-gradient(to right, ${solution.color} 0%, ${solution.color} 100%)`;
        } else if (solution.type === "mixed") {
            let gradient = "linear-gradient(to right";
            let total = 0;
            solution.colorList!.map((d: any) => {
                let goodColor = solutionLst.filter(solutionItem => solutionItem.id === d.color)[0];
                total += d.percent;
                gradient += `, ${goodColor.color} ${total - d.percent}%, ${goodColor.color} ${total}%`
            });
            gradient += ")";
            return gradient;
        }
        return '';
    }


    /**
     * Utilise le routeur pour naviguer vers une page donnée.
     *
     * @param {string} page - Le chemin de la page vers laquelle rediriger.
     */
    redirectTo(page: string) {
        this.router.navigate([page]);
    }

    /**
    * Affiche une notification toast avec SweetAlert2.
    * 
    * @param {string} message - Le message à afficher dans la notification.
    * @param {'success' | 'error' | 'warning' | 'info' | 'question'} [icon='success'] - L'icône à afficher dans la notification. Peut être 'success', 'error', 'warning', 'info' ou 'question'.
    */
    showSwalToast(message: string, icon: 'success' | 'error' | 'warning' | 'info' | 'question' = 'success') {
        Swal.fire({
            position: 'top-end',
            toast: true,
            icon: icon,
            title: `<div class="text-xl">${message}</div>`,
            showConfirmButton: false,
            width: 'auto',
            timer: 2500,
        });
    }

    /**
    * Renvoie un message d'erreur correspondant au code d'erreur fourni.
    *
    * @param {string} errorCode - Le code d'erreur retourné par le service d'authentification.
    * @returns {string} - Le message d'erreur correspondant.
    */
    getErrorMessage(errorCode: string): string {
        const errorMessages: { [key: string]: string } = {
            'auth/wrong-password': 'Le mot de passe actuel est incorrect.',
            'auth/weak-password': 'Le nouveau mot de passe est trop faible.',
            'auth/requires-recent-login': 'Cette opération nécessite une connexion récente. Veuillez vous reconnecter et réessayer.',
            'auth/invalid-email': 'L\'adresse email n\'est pas valide.',
            'auth/user-not-found': 'Aucun utilisateur trouvé avec cette adresse email.'
        };

        return errorMessages[errorCode] || 'Une erreur est survenue. Veuillez réessayer.';
    }

    /**
    * Affiche une modal spécifiée par son identifiant.
    * 
    * @param {string} id - L'identifiant de l'élément modal à afficher.
    */
    showModal(id: string) {
        const modal = document.getElementById(id) as HTMLDialogElement;
        if (modal) {
            modal.showModal();
        }
    }

    /**
    * Ferme une modal spécifiée par son identifiant.
    * 
    * @param {string} id - L'identifiant de l'élément modal à fermer.
    */
    closeModal(id: string) {
        const modal = document.getElementById(id) as HTMLDialogElement;
        if (modal) {
            modal.close();
        }
    }

    /**
     * Renvoie l'état actuel de l'activation des particules.
     * @returns {boolean} L'état actuel de l'activation des particules.
     */
    getShowParticule() {
        return this.showParticules();
    }

    /**
     * Met à jour l'état de l'activation des particules.
     * @param value La nouvelle valeur de l'activation des particules.
     */
    setShowParticule(value: boolean) {
        this.showParticules.set(value);
    }
    
    /**
     * Renvoie l'état actuel du dark mode.
     * @returns {boolean} L'état actuel du dark mode.
     */
    getDarkMode() {
        return this.darkMode();
    }

    /**
     * Met à jour l'état du dark mode.
     * @param value La nouvelle valeur du dark mode.
     */
    setDarkMode(value: boolean) {
        this.darkMode.set(value);
    }

    getNbRowsPerPage(height: number): number {
        if (height > 1080) {
            return 11;
        } else if (height <= 750) {
            return 4;
        } else {
            return 7;
        }
    }
}
