import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private auth: Auth = inject(Auth);

    private user: User | null = null;

    constructor(private router: Router) {
        // this.auth.onAuthStateChanged((user) => {
        //     if (user) this.user = user;
        // });
        this.auth.onAuthStateChanged((user) => {
            this.user = user;
            if (user) {
                this.router.navigate(['home']);
            } else {
                this.router.navigate(['login']);
            }
        });
    }

    signIn(email: string, password: string) {
        // signInWithEmailAndPassword(this.auth, email, password).then(() => {
        //     this.router.navigate(['home']);
        // });
        return signInWithEmailAndPassword(this.auth, email, password);
    }

    signOut() {
        // signOut(this.auth).then(() => this.router.navigate(['login']));
        return signOut(this.auth);
    }

    isLoggedIn(): boolean {
        return this.user !== null;
    }
}
