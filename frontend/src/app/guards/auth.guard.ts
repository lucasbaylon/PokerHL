import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
    const apiAuth = inject(AuthService);
    const router = inject(Router);

    return apiAuth.authState$.pipe(
        take(1),
        map(user => {

            if (user) {
                return true;
            }

            router.navigate(['/login']);
            return false;
        })
    );
};
