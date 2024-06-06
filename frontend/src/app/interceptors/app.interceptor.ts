import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { from, switchMap } from 'rxjs';

export const appInterceptor: HttpInterceptorFn = (req, next) => {
    const auth: Auth = inject(Auth);

    return from(auth.currentUser?.getIdToken() || Promise.resolve(null)).pipe(
        switchMap((token) => {
            if (token) {
                req = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            }
            return next(req);
        })
    );
};
