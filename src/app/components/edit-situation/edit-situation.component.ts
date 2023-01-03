import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-edit-situation',
    templateUrl: './edit-situation.component.html',
    styleUrls: ['./edit-situation.component.scss']
})
export class EditSituationComponent implements OnInit {

    constructor(private _Activatedroute: ActivatedRoute) { }

    ngOnInit(): void {
        let situation_id = this._Activatedroute.snapshot.params["id"];
        console.log(situation_id)
    }

}
