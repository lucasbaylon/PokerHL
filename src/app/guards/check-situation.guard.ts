import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { SituationService } from '../services/situation.service';

@Injectable({
    providedIn: 'root'
})
export class CheckSituationGuard implements CanActivate {

    constructor(private apiSituation: SituationService) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
        return this.checkSituation();
    }

    checkSituation() {
        return this.apiSituation.checkSituation().pipe(map((data: any) => {
            if (data.authorized) {
                return true;
            } else {
                let message = "Une erreur est survenue.";
                if (data.message === "DIRECTORY_EMPTY") {
                    message = "Vous n'avez encore crée aucune situation pour vos entraînements. Veuillez d'abord créer une situation dans le menu 'Gérer les situations'.";
                }
                Swal.fire({
                    icon: 'error',
                    html: '<h1 style="font-family: \'Lato\', sans-serif; margin-top:-10px;">Erreur !</h1><p style="font-family: \'Lato\', sans-serif;">Aucune situation d\'entraînement existante.<br> Veuillez d\'abord créer une situation dans le menu "Gérer les situations".</p>',
                    confirmButtonColor: '#090a0f',
                    confirmButtonText:'<p style="font-family: \'Lato\', sans-serif;">C\'est compris !</p>'
                })
                return false;
            }
        }))
    }
}
