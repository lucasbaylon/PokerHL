import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-situations',
    templateUrl: './situations.component.html',
    styleUrls: ['./situations.component.scss']
})
export class SituationsComponent implements OnInit {

    situationName: string = ""
    situation_array: any;

    actionSelected: string = "";

    constructor(private router: Router) { }

    ngOnInit(): void {
        this.situation_array = {
            actions: [
                {
                    name: "radio_action_0",
                    display_name: "All In"
                },
                {
                    name: "radio_action_1",
                    display_name: "Call"
                },
                {
                    name: "radio_action_2",
                    display_name: "Check"
                },
                {
                    name: "radio_action_3",
                    display_name: ""
                },
                {
                    name: "radio_action_4",
                    display_name: ""
                },
                {
                    name: "radio_action_5",
                    display_name: ""
                },
                {
                    name: "radio_action_6",
                    display_name: ""
                },
            ],
            situations: [
                [{"card":"AA","action":""},{"card":"AKs","action":""},{"card":"AQs","action":""},{"card":"AJs","action":""},{"card":"ATs","action":""},{"card":"A9s","action":""},{"card":"A8s","action":""},{"card":"A7s","action":""},{"card":"A6s","action":""},{"card":"A5s","action":""},{"card":"A4s","action":""},{"card":"A3s","action":""},{"card":"A2s","action":""}],
                [{"card":"AKo","action":""},{"card":"KK","action":""},{"card":"KQs","action":""},{"card":"KJs","action":""},{"card":"KTs","action":""},{"card":"K9s","action":""},{"card":"K8s","action":""},{"card":"K7s","action":""},{"card":"K6s","action":""},{"card":"K5s","action":""},{"card":"K4s","action":""},{"card":"K3s","action":""},{"card":"K2s","action":""}],
                [{"card":"AQo","action":""},{"card":"KQo","action":""},{"card":"QQ","action":""},{"card":"QJs","action":""},{"card":"QTs","action":""},{"card":"Q9s","action":""},{"card":"Q8s","action":""},{"card":"Q7s","action":""},{"card":"Q6s","action":""},{"card":"Q5s","action":""},{"card":"Q4s","action":""},{"card":"Q3s","action":""},{"card":"Q2s","action":""}],
                [{"card":"AJo","action":""},{"card":"KJo","action":""},{"card":"QJo","action":""},{"card":"JJ","action":""},{"card":"JTs","action":""},{"card":"J9s","action":""},{"card":"J8s","action":""},{"card":"J7s","action":""},{"card":"J6s","action":""},{"card":"J5s","action":""},{"card":"J4s","action":""},{"card":"J3s","action":""},{"card":"J2s","action":""}],
                [{"card":"ATo","action":""},{"card":"KTo","action":""},{"card":"QTo","action":""},{"card":"JTo","action":""},{"card":"TT","action":""},{"card":"T9s","action":""},{"card":"T8s","action":""},{"card":"T7s","action":""},{"card":"T6s","action":""},{"card":"T5s","action":""},{"card":"T4s","action":""},{"card":"T3s","action":""},{"card":"T2s","action":""}],
                [{"card":"A9o","action":""},{"card":"K9o","action":""},{"card":"Q9o","action":""},{"card":"J9o","action":""},{"card":"T9o","action":""},{"card":"99","action":""},{"card":"98s","action":""},{"card":"97s","action":""},{"card":"96s","action":""},{"card":"95s","action":""},{"card":"94s","action":""},{"card":"93s","action":""},{"card":"92s","action":""}],
                [{"card":"A8o","action":""},{"card":"K8o","action":""},{"card":"Q8o","action":""},{"card":"J8o","action":""},{"card":"T8o","action":""},{"card":"98o","action":""},{"card":"88","action":""},{"card":"87s","action":""},{"card":"86s","action":""},{"card":"85s","action":""},{"card":"84s","action":""},{"card":"83s","action":""},{"card":"82s","action":""}],
                [{"card":"A7o","action":""},{"card":"K7o","action":""},{"card":"Q7o","action":""},{"card":"J7o","action":""},{"card":"T7o","action":""},{"card":"97o","action":""},{"card":"87o","action":""},{"card":"77","action":""},{"card":"76s","action":""},{"card":"75s","action":""},{"card":"74s","action":""},{"card":"73s","action":""},{"card":"72s","action":""}],
                [{"card":"A6o","action":""},{"card":"K6o","action":""},{"card":"Q6o","action":""},{"card":"J6o","action":""},{"card":"T6o","action":""},{"card":"96o","action":""},{"card":"86o","action":""},{"card":"76o","action":""},{"card":"66","action":""},{"card":"65s","action":""},{"card":"64s","action":""},{"card":"63s","action":""},{"card":"62s","action":""}],
                [{"card":"A5o","action":""},{"card":"K5o","action":""},{"card":"Q5o","action":""},{"card":"J5o","action":""},{"card":"T5o","action":""},{"card":"95o","action":""},{"card":"85o","action":""},{"card":"75o","action":""},{"card":"65o","action":""},{"card":"55","action":""},{"card":"54s","action":""},{"card":"53s","action":""},{"card":"52s","action":""}],
                [{"card":"A4o","action":""},{"card":"K4o","action":""},{"card":"Q4o","action":""},{"card":"J4o","action":""},{"card":"T4o","action":""},{"card":"94o","action":""},{"card":"84o","action":""},{"card":"74o","action":""},{"card":"64o","action":""},{"card":"54o","action":""},{"card":"44","action":""},{"card":"43s","action":""},{"card":"42s","action":""}],
                [{"card":"A3o","action":""},{"card":"K3o","action":""},{"card":"Q3o","action":""},{"card":"J3o","action":""},{"card":"T3o","action":""},{"card":"93o","action":""},{"card":"83o","action":""},{"card":"73o","action":""},{"card":"63o","action":""},{"card":"53o","action":""},{"card":"43o","action":""},{"card":"33","action":""},{"card":"32s","action":""}],
                [{"card":"A2o","action":""},{"card":"K2o","action":""},{"card":"Q2o","action":""},{"card":"J2o","action":""},{"card":"T2o","action":""},{"card":"92o","action":""},{"card":"82o","action":""},{"card":"72o","action":""},{"card":"62o","action":""},{"card":"52o","action":""},{"card":"42o","action":""},{"card":"32o","action":""},{"card":"22","action":""}]
            ]
        }
    }

    redirectToHome() {
        this.router.navigate(['home']);
    }

    cancelSituation() {
        this.situationName = "";
    }

    saveAction(e: any) {
        let cell_index = e.target.cellIndex;
        let row_index = e.target.parentElement.rowIndex;
        this.situation_array.situations[row_index][cell_index].action = this.actionSelected;
    }

    saveSituation() {
        console.log(this.situationName)
        console.log(this.situation_array)
    }

    onChangeAction(e: any) {
        this.actionSelected = e.target.value;
    }

}
