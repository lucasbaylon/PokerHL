import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = (route, state) => {
    const apiAuth = inject(AuthService);
    const router = inject(Router);

    const isLoggedIn = apiAuth.isLoggedIn();
    if (!isLoggedIn) {
        router.navigate(['/login']);
    }
    return isLoggedIn;
};
