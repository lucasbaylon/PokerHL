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
        // this.router.navigate([`edit/${id}`]);
    }

    removeSituation(id: string) {
        Swal.fire({
            title: 'Êtes vous sûr ?',
            text: "Vous ne pourrez pas revenir en arrière !",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Oui, supprimer !',
            cancelButtonText: 'Annuler'
        }).then((result) => {
            if (result.isConfirmed) {
                this.apiSituation.removeSituation(id);
                Swal.fire(
                    'Deleted!',
                    'Your file has been deleted.',
                    'success'
                )
            }
        });
    }

}
