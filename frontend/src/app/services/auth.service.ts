import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, User, authState } from '@angular/fire/auth';
authState
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private auth: Auth = inject(Auth);
    authState$ = authState(this.auth);
    authStateSubscription: Subscription;

    private user: User | null = null;

    isLoading = new BehaviorSubject<boolean>(true);

    constructor(
        private router: Router
    ) {
        // this.authStateSubscription = this.authState$.subscribe((aUser: User | null) => {
        //     console.log(aUser);
        //     this.user = aUser;
        //     if (aUser) {
        //         this.router.navigate(['home']);
        //     } else {
        //         this.router.navigate(['login']);
        //     }
        // })

        this.authStateSubscription = this.authState$.subscribe((aUser: User | null) => {
            console.log(aUser);
            this.user = aUser;
            this.isLoading.next(false);
            if (aUser) {
                this.router.navigate(['home']);
            } else {
                this.router.navigate(['login']);
            }
        });
    }

    ngOnDestroy() {
        this.authStateSubscription.unsubscribe();
    }

    signIn(email: string, password: string) {
        return signInWithEmailAndPassword(this.auth, email, password);
    }

    signOut() {
        return signOut(this.auth);
    }

    isLoggedIn(): boolean {
        return this.user !== null;
    }
}
