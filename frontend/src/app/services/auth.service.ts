import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, User, authState } from '@angular/fire/auth';
authState
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { BehaviorSubject, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

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
            Swal.fire({
                position: 'top-end',
                toast: true,
                icon: 'success',
                title: '<span style="font-size: 1.3vw;">Connexion réussie !</span>',
                showConfirmButton: false,
                width: 'auto',
                timer: 2500
            });
        }).catch((error) => {
            let errorMessage = 'Échec de connexion';
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Adresse email non valide';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Compte désactivé';
                    break;
            }
            Swal.fire({
                position: 'top-end',
                toast: true,
                icon: 'error',
                title: `<span style="font-size: 1.3vw;">${errorMessage}</span>`,
                showConfirmButton: false,
                width: 'auto',
                timer: 2500
            });
        });
    }

    signOut() {
        return signOut(this.auth).then((result) => {
            Swal.fire({
                position: 'top-end',
                toast: true,
                icon: 'success',
                title: '<span style="font-size: 1.3vw;">Déconnexion réussie !</span>',
                showConfirmButton: false,
                width: 'auto',
                timer: 2500
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
