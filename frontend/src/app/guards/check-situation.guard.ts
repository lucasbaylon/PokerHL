import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { SituationService } from '../services/situation.service';
import { map } from 'rxjs/operators';
import Swal from 'sweetalert2';

export const checkSituationGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {

    const apiSituation = inject(SituationService);

    return apiSituation.checkSituation().pipe(map((data: any) => {
        if (data.authorized) {
            return true;
        } else {
            let message = "Une erreur est survenue.";
            if (data.message === "DIRECTORY_EMPTY") {
                message = "Vous n'avez encore crée aucune situation pour vos entraînements. Veuillez d'abord créer une situation dans le menu 'Gérer les situations'.";
            }
            Swal.fire({
                icon: 'error',
                html: '<h1 style="font-family: \'Lato\', sans-serif; margin-top:-10px;">Erreur !</h1><p style="font-family: \'Lato\', sans-serif; margin-bottom:0; font-size: 1.2em;">Aucune situation d\'entraînement existante.<br> Veuillez d\'abord créer une situation dans le menu "Gérer les situations".</p>',
                confirmButtonColor: '#d74c4c',
                confirmButtonText:'<p style="font-family: \'Lato\', sans-serif; margin-top:0; margin-bottom:0; font-size: 1.1em; font-weight: 600;">C\'est compris !</p>'
            })
            return false;
        }
    }));
};
