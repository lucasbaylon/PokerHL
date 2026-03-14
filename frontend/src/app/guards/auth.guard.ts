import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs';

/**
 * Garde de navigation vérifiant si l'utilisateur est authentifié avec Firebase.
 * Redirige vers /login en cas d'échec.
 */
export const authGuard: CanActivateFn = (route, state) => {
    const apiAuth = inject(AuthService);
    const router = inject(Router);

    return apiAuth.authState$.pipe(
        take(1),
        map(user => {

            if (user) return true;

            router.navigate(['/login']);
            return false;
        })
    );
};
