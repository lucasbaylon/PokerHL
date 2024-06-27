import { inject, Injectable } from '@angular/core';
import { Auth, authState, createUserWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updatePassword, updateProfile, User, UserCredential } from '@angular/fire/auth';
import { deleteObject, getDownloadURL, ref, Storage, uploadBytesResumable } from '@angular/fire/storage';
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { UserParams } from '../interfaces/user-params';
import { CommonService } from './../services/common.service';


@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private readonly storage: Storage = inject(Storage);
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

    async signUp(email: string, password: string, displayName: string) {
        return createUserWithEmailAndPassword(this.auth, email, password).then((result) => {
            this.commonService.showSwalToast(`Inscription réussie !`);
            this.router.navigate(['home']);
            setTimeout(() => {
                this.setUserDisplayName(displayName);
            }, 500);
        }).catch((error) => {
            let errorMessage = 'Échec de l\'inscription';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Adresse email déjà utilisée';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Adresse email non valide';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Mot de passe trop faible';
                    break;
            }
            this.commonService.showSwalToast(`${errorMessage}`, 'error');
        });
    }

    isLoggedIn(): boolean {
        return this.userSubject.value !== null;
    }

    getUser(): User | null {
        return this.userSubject.value;
    }

    getUserDisplayName(): string | null | undefined {
        return this.userSubject.value?.displayName;
    }

    getUserEmail(): string | null | undefined {
        return this.userSubject.value?.email;
    }

    getUserAvatar(): string | null | undefined {
        return this.userSubject.value?.photoURL;
    }

    setUserDisplayName(displayName: string) {
        const user = this.getUser();
        if (user) {
            updateProfile(user, { displayName });
        }
    }

    setUserAvatar(newAvatar: string) {
        const user = this.getUser();
        if (user) {
            updateProfile(user, { photoURL: newAvatar });
        }
    }

    removeAvatar(fileName: string) {
        const storageRef = ref(this.storage, fileName);
        deleteObject(storageRef);
    }

    uploadAvatar(file: File) {
        const fileName = `avatar/${this.getUserEmail() as string}`
        try {
            this.removeAvatar(fileName);
        } catch(e) {
            console.error(e);
        }
        const storageRef = ref(this.storage, fileName);
        uploadBytesResumable(storageRef, file).then(async (res) => {
            const url = await getDownloadURL(res.ref);
            this.setUserAvatar(url);
        });
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
