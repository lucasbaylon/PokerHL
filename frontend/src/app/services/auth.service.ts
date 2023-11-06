import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, User, authState } from '@angular/fire/auth';
authState
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BehaviorSubject, Subscription } from 'rxjs';

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
        private messageService: MessageService
    ) {
        this.authStateSubscription = authState(this.auth).subscribe((aUser: User | null) => {
            this.userSubject.next(aUser);
            this.isLoading.next(false);

            const currentUrl = this.router.url;
            if (aUser) {
                if (!localStorage.getItem('userParams')) {
                    localStorage.setItem(
                        'userParams',
                        JSON.stringify({ darkMode: false, cardStyle: 'default', playmatColor: 'green', displaySolution: false })
                    );
                }
                if (currentUrl.startsWith('/login')) {
                    this.router.navigate(['home']);
                }
                else if (!localStorage.getItem('userParams')) {
                    this.router.navigate(['home']);
                }
            } else {
                this.router.navigate(['login']);
            }
        });
    }

    ngOnDestroy() {
        this.authStateSubscription.unsubscribe();
    }

    signIn(email: string, password: string) {
        return signInWithEmailAndPassword(this.auth, email, password).then((result) => {
            this.messageService.add({
                severity: 'success',
                summary: 'Connexion Réussie',
                detail: 'Vous êtes maintenant connecté !'
            });
        }).catch((error) => {
            let errorMessage = 'Une erreur est survenue lors de la connexion';
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'L\'adresse email n\'est pas valide';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Ce compte a été désactivé';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'Aucun utilisateur trouvé avec cet email';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Mot de passe incorrect';
                    break;
            }
            this.messageService.add({ severity: 'error', summary: 'Erreur de Connexion', detail: errorMessage });
        });
    }

    signOut() {
        return signOut(this.auth).then((result) => {
            this.messageService.add({
                severity: 'success',
                summary: 'Déconnexion Réussie',
                detail: 'Vous êtes maintenant déconnecté !'
            });
        });
    }

    isLoggedIn(): boolean {
        return this.userSubject.value !== null;
    }

    getUser(): User | null {
        return this.userSubject.value;
    }
}
