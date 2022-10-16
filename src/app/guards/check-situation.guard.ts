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
                    message = "Aucune situation n'est enregistré.";
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Oups...',
                    text: message
                })
                return false;
            }
        }))
    }
}
