import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SituationService } from 'src/app/services/situation.service';
import { Situation } from 'src/app/interfaces/situation';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-manage-situation',
    templateUrl: './manage-situation.component.html',
    styleUrls: ['./manage-situation.component.scss']
})
export class ManageSituationComponent implements OnInit {

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
        this.router.navigate(['situations', {situation_id: id}]);
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
                    width:'359px',
                    timer: 2500
                });
            }
        });
    }

}
