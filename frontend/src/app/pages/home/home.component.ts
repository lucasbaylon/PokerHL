import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { Auth, User, user } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {
    private auth: Auth = inject(Auth);
    // user$ = user(this.auth);
    // userSubscription: Subscription;

    constructor(private router: Router) {
        // this.userSubscription = this.user$.subscribe((aUser: User | null) => {
        //     //handle user state changes here. Note, that user will be null if there is no currently logged in user.
        //     console.log(aUser);
        // })
    }

    ngOnInit(): void {
        const auth = getAuth();
        signInWithEmailAndPassword(auth, "thezartop@gmail.com", "lucas64")
            .then((userCredential) => {
                // Signed in 
                const user = userCredential.user;
                console.log(user)
            })
            .catch((error) => {
                console.log(error)
                const errorCode = error.code;
                const errorMessage = error.message;
            });
    }

    redirectTo(page: string) {
        this.router.navigate([page]);
    }

}
