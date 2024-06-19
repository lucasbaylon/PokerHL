import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Auth, signInWithEmailAndPassword, signOut, User, authState, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword, UserCredential } from '@angular/fire/auth';
import { CommonService } from './../services/common.service';
import { UserParams } from '../interfaces/user-params';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private auth: Auth = inject(Auth);
    authState$ = authState(this.auth);
    authStateSubscription: Subscription;

    private userSubject = new BehaviorSubject<User | null>(null);

    isLoading = new BehaviorSubject<boolean>(true);

    constructor(
        private router: Router,
        private commonService: CommonService
    ) {
        this.authStateSubscription = authState(this.auth).subscribe((aUser: User | null) => {
            this.userSubject.next(aUser);
            this.isLoading.next(false);

            const currentUrl = this.router.url;
            if (aUser) {
                if (!localStorage.getItem('userParams')) {
                    localStorage.setItem(
                        'userParams',
                        JSON.stringify({ cardStyle: 'default', playmatColor: 'green', displaySolution: false, autoMultipleSolutionName: false, showParticules: false })
                    );
                }
                if (!localStorage.getItem('theme')) {
                    localStorage.setItem('theme', 'light');
                }
                if (currentUrl.startsWith('/login')) {
                    this.router.navigate(['home']);
                } else if (!localStorage.getItem('userParams')) {
                    this.router.navigate(['home']);
                }
                const userParams: UserParams = JSON.parse(localStorage.getItem('userParams')!);
                this.commonService.setShowParticule(userParams.showParticules);
            } else {
                this.router.navigate(['login']);
            }
        });
    }

    ngOnDestroy() {
        this.authStateSubscription.unsubscribe();
    }

    async signIn(email: string, password: string) {
        return signInWithEmailAndPassword(this.auth, email, password).then((result) => {
            this.commonService.showSwalToast(`Connexion réussie !`);
        }).catch((error) => {
            let errorMessage = 'Échec de connexion';
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Adresse email non valide';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Mot de passe incorrect';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Compte désactivé';
                    break;
            }
            this.commonService.showSwalToast(`${errorMessage}`, 'error');
        });
    }

    async signOut() {
        return signOut(this.auth).then((result) => {
            this.commonService.showSwalToast(`Déconnexion réussie !`);
        });
    }

    isLoggedIn(): boolean {
        return this.userSubject.value !== null;
    }

    getUser(): User | null {
        return this.userSubject.value;
    }

    sendPasswordResetEmail(email: string) {
        return sendPasswordResetEmail(this.auth, email);
    }

    reauthenticate(currentPassword: string): Promise<UserCredential> {
        const user = this.getUser();
        if (user && user.email) {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            return reauthenticateWithCredential(user, credential);
        } else {
            return Promise.reject('No user logged in');
        }
    }

    async changePassword(newPassword: string): Promise<void> {
        const user = this.getUser();
        if (user) {
            return updatePassword(user, newPassword);
        } else {
            return Promise.reject('No user logged in');
        }
    }
}
