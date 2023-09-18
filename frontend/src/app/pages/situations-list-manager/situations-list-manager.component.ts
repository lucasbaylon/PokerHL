import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Situation } from 'src/app/interfaces/situation';
import { SituationService } from 'src/app/services/situation.service';

import Swal from 'sweetalert2';

@Component({
    selector: 'app-situations-list-manager',
    templateUrl: './situations-list-manager.component.html',
    styleUrls: ['./situations-list-manager.component.scss']
})
export class SituationsListManagerComponent {

    situationList: Situation[] = [];

    constructor(
        private router: Router,
        private apiSituation: SituationService
    ) { }

    ngOnInit(): void {
        this.apiSituation.situations.subscribe(data => {
            this.situationList = data;
        });

        this.apiSituation.getSituations();
    }

    redirectTo(page: string) {
        this.router.navigate([page]);
    }

    editSituation(id: string) {
        this.router.navigate(['situations-manager', { situation_id: id }]);
    }

    duplicateSituation(id: string) {
        this.apiSituation.duplicateSituation(id);
    }

    removeSituation(id: string) {
        Swal.fire({
            html: '<h1 style="font-family: \'Lato\', sans-serif; margin-top:-10px;">Attention !</h1><p style="font-family: \'Lato\', sans-serif; margin-bottom:0; font-size: 1.2em;">Voulez vous vraiment supprimer cette situation ? Vous ne pourrez pas revenir en arrière !</p>',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d74c4c',
            confirmButtonText: 'Oui, supprimer !',
            cancelButtonText: 'Annuler'
        }).then((result) => {
            if (result.isConfirmed) {
                this.apiSituation.removeSituation(id);
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    html: '<h2 style="font-family: \'Lato\', sans-serif;margin-top:16px; margin-bottom:0; font-size: 1.5em;">Situation supprimée !</h3>',
                    showConfirmButton: false,
                    width: '359px',
                    timer: 2500
                });
            }
        });
    }

}
