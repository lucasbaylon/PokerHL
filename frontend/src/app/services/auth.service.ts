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

    private user: User | null = null;

    isLoading = new BehaviorSubject<boolean>(true);

    constructor(
        private router: Router,
        private messageService: MessageService
    ) {
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
        return signInWithEmailAndPassword(this.auth, email, password).then((result) => {
            // La connexion est réussie !
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
            // La connexion est réussie !
            this.messageService.add({
                severity: 'success',
                summary: 'Déconnexion Réussie',
                detail: 'Vous êtes maintenant déconnecté !'
            });
        });
    }

    isLoggedIn(): boolean {
        return this.user !== null;
    }
}
