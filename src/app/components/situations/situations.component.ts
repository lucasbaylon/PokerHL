import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/services/common.service';
import { SituationService } from 'src/app/services/situation.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-situations',
    templateUrl: './situations.component.html',
    styleUrls: ['./situations.component.scss']
})
export class SituationsComponent implements OnInit {

    situationName: string = ""

    situation_array: any;

    actionSelected: string = "radio_action_0";

    constructor(
        private router: Router,
        private apiSituation: SituationService,
        private apiCommon: CommonService
    ) { }

    ngOnInit(): void {
        this.situation_array = this.apiCommon.empty_situation_array;
    }

    redirectToHome() {
        this.router.navigate(['home']);
    }

    cancelSituation() {
        this.situationName = "";
        this.situation_array = this.apiCommon.empty_situation_array;
        // console.log(this.situation_array)
        // this.situation_array.situations = this.situation_array.situations.map((row: any) => {
        //     row.map((situation: any) => {
        //         return situation.action = ""
        //     })
        //     return row;
        // })
    }

    saveAction(e: any) {
        let cell_index = e.target.cellIndex;
        let row_index = e.target.parentElement.rowIndex;
        this.situation_array.situations[row_index][cell_index].action = this.actionSelected;
    }

    saveSituation() {
        console.log(this.situation_array)
        // if (this.situationName === "") {
        //     Swal.fire({
        //         position: 'top-end',
        //         icon: 'warning',
        //         title: 'Merci de donner un nom à la situation.',
        //         showConfirmButton: false,
        //         timer: 2000
        //     })
        // } else {
        //     let situation_empty = false;
        //     this.situation_array.situations.map((row: any) => {
        //         row.map((situation: any) => {
        //             if (situation.action === "") situation_empty = true;
        //         })
        //     })

        //     console.log("situation manquante =", situation_empty)
        //     if (situation_empty) {
        //         Swal.fire({
        //             position: 'top-end',
        //             icon: 'warning',
        //             title: 'Merci de remplir toutes les situations.',
        //             showConfirmButton: false,
        //             timer: 2000
        //         })
        //     } else {
        //         let data = {
        //             situation_name: this.situationName,
        //             data: this.situation_array
        //         }
        //         this.apiSituation.addSituation(data);
        //         Swal.fire({
        //             position: 'top-end',
        //             icon: 'success',
        //             title: 'La situation a bien été créer !',
        //             showConfirmButton: false,
        //             timer: 2000
        //         })
        //         this.router.navigate(['home']);
        //     }
        // }
    }

    onChangeAction(e: any) {
        this.actionSelected = e.target.value;
    }

}
