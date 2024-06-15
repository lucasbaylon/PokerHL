import { CanActivateFn, Router } from '@angular/router';
import { SituationService } from '../services/situation.service';
import { inject } from '@angular/core';
import { map, of, switchMap, take } from 'rxjs';
import { CommonService } from '../services/common.service';
import { AuthService } from '../services/auth.service';

export const checkSituationGuard: CanActivateFn = (route, state) => {
    const apiSituation = inject(SituationService);
    const commonService = inject(CommonService);
    const authService = inject(AuthService);
    const router = inject(Router);

    const previousUrl = router.getCurrentNavigation()?.previousNavigation?.finalUrl?.toString();

    return authService.authState$.pipe(
        take(1),
        switchMap(user => {
            if (user) {
                return apiSituation.checkSituationForUser().pipe(
                    map((data: any) => {
                        if (data.authorized) {
                            return true;
                        } else {
                            let message = "Une erreur est survenue.";
                            if (data.message === "NO_SITUATION") {
                                message = "Veuillez d'abord créer une situation dans le menu 'Situations'.";
                            }
                            commonService.showSwalToast(message, 'error');
                            if (!previousUrl) router.navigate(['/home']);
                            return false;
                        }
                    })
                );
            } else {
                commonService.showSwalToast('Utilisateur non authentifié.', 'error');
                return of(false);
            }
        })
    );
};
