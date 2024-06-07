import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener } from '@angular/core';
import { Situation } from '../../interfaces/situation';
import { Router } from '@angular/router';
import { SituationService } from '../../services/situation.service';
import Swal from 'sweetalert2';
import { DealerPipe } from '../../pipes/dealer.pipe';
import { OpponentLevelPipe } from '../../pipes/opponent-level.pipe';
import { TableModule } from 'primeng/table';

@Component({
    selector: 'app-situations-list-manager',
    standalone: true,
    imports: [TableModule, DealerPipe, OpponentLevelPipe],
    templateUrl: './situations-list-manager.component.html',
    styleUrl: './situations-list-manager.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SituationsListManagerComponent {

    situationList: Situation[] = [];

    nbRowsPerPage = 10;

    paginatorAnimationDelay = "0s"

    constructor(
        private router: Router,
        private apiSituation: SituationService
    ) { }

    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        if (event.target.innerHeight > 1080) {
            this.nbRowsPerPage = 10;
        } else {
            this.nbRowsPerPage = 7;
        }
        this.paginatorAnimationDelay = 0.1 + this.nbRowsPerPage * 0.075 + 's';
    }

    ngOnInit(): void {
        this.apiSituation.situations.subscribe(data => {
            this.situationList = data;
        });

        this.apiSituation.getSituations();

        if (window.innerHeight <= 1080) {
            this.nbRowsPerPage = 7;
        }
    }

    redirectTo(page: string) {
        this.router.navigate([page]);
    }

    editSituation(id: string) {
        this.router.navigate(['situations-manager', { situation_id: id }]);
    }

    duplicateSituation(id: string) {
        this.apiSituation.duplicateSituation(id);
        Swal.fire({
            position: 'top-end',
            toast: true,
            icon: 'success',
            title: '<span style="font-size: 1.3vw;">Situation dupliquée !</span>',
            showConfirmButton: false,
            width: 'auto',
            timer: 2500
        });
    }

    removeSituation(id: string) {
        Swal.fire({
            html: '<h1 style="font-family: \'Inter\', sans-serif; margin-top:-10px;">Attention !</h1><p style="font-family: \'Inter\', sans-serif; margin-bottom:0; font-size: 1.2em;">Voulez vous vraiment supprimer cette situation ? Vous ne pourrez pas revenir en arrière !</p>',
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
                    title: '<span style="font-size: 1.3vw;">Situation supprimée !</span>',
                    showConfirmButton: false,
                    width: 'auto',
                    timer: 2500
                });
            }
        });
    }

}
