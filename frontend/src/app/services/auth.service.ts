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

    /**
     * Se désabonne des flux à la destruction du service.
     */
    ngOnDestroy() {
        this.authStateSubscription.unsubscribe();
    }

    /**
     * Connecte l'utilisateur avec email et mot de passe.
     * @param email Adresse email.
     * @param password Mot de passe.
     * @returns Une promesse de UserCredential.
     */
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

    /**
     * Déconnecte l'utilisateur actuel.
     * @returns Une promesse de void.
     */
    async signOut() {
        return signOut(this.auth).then((result) => {
            this.commonService.showSwalToast(`Déconnexion réussie !`);
        });
    }

    /**
     * Inscrit un nouvel utilisateur.
     * @param email Adresse email.
     * @param password Mot de passe.
     * @param displayName Nom d'affichage.
     * @returns Une promesse de UserCredential.
     */
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

    /**
     * Vérifie si un utilisateur est actuellement connecté.
     * @returns Vrai si connecté.
     */
    isLoggedIn(): boolean {
        return this.userSubject.value !== null;
    }

    /**
     * Retourne l'objet utilisateur Firebase actuel.
     * @returns L'utilisateur ou null.
     */
    getUser(): User | null {
        return this.userSubject.value;
    }

    /**
     * Retourne le nom d'affichage de l'utilisateur.
     * @returns Le nom ou undefined.
     */
    getUserDisplayName(): string | null | undefined {
        return this.userSubject.value?.displayName;
    }

    /**
     * Retourne l'email de l'utilisateur.
     * @returns L'email ou undefined.
     */
    getUserEmail(): string | null | undefined {
        return this.userSubject.value?.email;
    }

    /**
     * Retourne l'URL de l'avatar de l'utilisateur.
     * @returns L'URL ou undefined.
     */
    getUserAvatar(): string | null | undefined {
        return this.userSubject.value?.photoURL;
    }

    /**
     * Met à jour le nom d'affichage de l'utilisateur.
     * @param displayName Nouveau nom.
     */
    setUserDisplayName(displayName: string) {
        const user = this.getUser();
        if (user) {
            updateProfile(user, { displayName });
        }
    }

    /**
     * Met à jour l'URL de l'avatar de l'utilisateur.
     * @param newAvatar Nouvelle URL d'image.
     */
    setUserAvatar(newAvatar: string) {
        const user = this.getUser();
        if (user) {
            updateProfile(user, { photoURL: newAvatar });
        }
    }

    /**
     * Supprime un fichier du stockage Firebase.
     * @param fileName Chemin du fichier.
     */
    removeAvatar(fileName: string) {
        const storageRef = ref(this.storage, fileName);
        deleteObject(storageRef);
    }

    /**
     * Télécharge un nouvel avatar et met à jour le profil.
     * @param file Fichier image.
     */
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

    /**
     * Envoie un email de réinitialisation de mot de passe.
     * @param email Adresse email.
     * @returns Une promesse Firebase.
     */
    sendPasswordResetEmail(email: string) {
        return sendPasswordResetEmail(this.auth, email);
    }

    /**
     * Ré-authentifie l'utilisateur actuel (nécessaire pour changer le mot de passe).
     * @param currentPassword Mot de passe actuel.
     * @returns Une promesse de UserCredential.
     */
    reauthenticate(currentPassword: string): Promise<UserCredential> {
        const user = this.getUser();
        if (user && user.email) {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            return reauthenticateWithCredential(user, credential);
        } else {
            return Promise.reject('No user logged in');
        }
    }

    /**
     * Change le mot de passe de l'utilisateur.
     * @param newPassword Nouveau mot de passe.
     * @returns Une promesse de void.
     */
    async changePassword(newPassword: string): Promise<void> {
        const user = this.getUser();
        if (user) {
            return updatePassword(user, newPassword);
        } else {
            return Promise.reject('No user logged in');
        }
    }
}
