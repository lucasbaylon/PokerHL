import { Injectable } from '@angular/core';
import { Situation } from '../interfaces/situation';
import { Action } from '../interfaces/action';

@Injectable({
    providedIn: 'root'
})
export class CommonService {

    empty_situation_obj: Situation = {
        _id: undefined,
        name: undefined,
        nbPlayer: 3,
        dealerMissingTokens: 0,
        dealer: "you",
        opponentLevel: "fish",
        actions: [
            {
                id: "unique_action_0",
                type: "unique",
                display_name: "All In",
                color: "#d80c05"
            },
            {
                id: "unique_action_1",
                type: "unique",
                display_name: "Call",
                color: "#00aeff"
            },
            {
                id: "unique_action_2",
                type: "unique",
                display_name: "Check",
                color: "#96c582"
            },
            // {
            //     id: "mixed_action_0",
            //     type: "mixed",
            //     display_name: "test",
            //     colorList: [
            //         {
            //             color: "unique_action_0",
            //             percent: 50
            //         },
            //         {
            //             color: "unique_action_1",
            //             percent: 50
            //         }
            //     ]
            // },
            // {
            //     id: "mixed_action_1",
            //     type: "mixed",
            //     display_name: "salut",
            //     colorList: [
            //         {
            //             color: "unique_action_0",
            //             percent: 20
            //         },
            //         {
            //             color: "unique_action_1",
            //             percent: 80
            //         }
            //     ]
            // }
        ],
        situations: [
            [{ "card": "AA", "action": undefined }, { "card": "AKs", "action": undefined }, { "card": "AQs", "action": undefined }, { "card": "AJs", "action": undefined }, { "card": "ATs", "action": undefined }, { "card": "A9s", "action": undefined }, { "card": "A8s", "action": undefined }, { "card": "A7s", "action": undefined }, { "card": "A6s", "action": undefined }, { "card": "A5s", "action": undefined }, { "card": "A4s", "action": undefined }, { "card": "A3s", "action": undefined }, { "card": "A2s", "action": undefined }],
            [{ "card": "AKo", "action": undefined }, { "card": "KK", "action": undefined }, { "card": "KQs", "action": undefined }, { "card": "KJs", "action": undefined }, { "card": "KTs", "action": undefined }, { "card": "K9s", "action": undefined }, { "card": "K8s", "action": undefined }, { "card": "K7s", "action": undefined }, { "card": "K6s", "action": undefined }, { "card": "K5s", "action": undefined }, { "card": "K4s", "action": undefined }, { "card": "K3s", "action": undefined }, { "card": "K2s", "action": undefined }],
            [{ "card": "AQo", "action": undefined }, { "card": "KQo", "action": undefined }, { "card": "QQ", "action": undefined }, { "card": "QJs", "action": undefined }, { "card": "QTs", "action": undefined }, { "card": "Q9s", "action": undefined }, { "card": "Q8s", "action": undefined }, { "card": "Q7s", "action": undefined }, { "card": "Q6s", "action": undefined }, { "card": "Q5s", "action": undefined }, { "card": "Q4s", "action": undefined }, { "card": "Q3s", "action": undefined }, { "card": "Q2s", "action": undefined }],
            [{ "card": "AJo", "action": undefined }, { "card": "KJo", "action": undefined }, { "card": "QJo", "action": undefined }, { "card": "JJ", "action": undefined }, { "card": "JTs", "action": undefined }, { "card": "J9s", "action": undefined }, { "card": "J8s", "action": undefined }, { "card": "J7s", "action": undefined }, { "card": "J6s", "action": undefined }, { "card": "J5s", "action": undefined }, { "card": "J4s", "action": undefined }, { "card": "J3s", "action": undefined }, { "card": "J2s", "action": undefined }],
            [{ "card": "ATo", "action": undefined }, { "card": "KTo", "action": undefined }, { "card": "QTo", "action": undefined }, { "card": "JTo", "action": undefined }, { "card": "TT", "action": undefined }, { "card": "T9s", "action": undefined }, { "card": "T8s", "action": undefined }, { "card": "T7s", "action": undefined }, { "card": "T6s", "action": undefined }, { "card": "T5s", "action": undefined }, { "card": "T4s", "action": undefined }, { "card": "T3s", "action": undefined }, { "card": "T2s", "action": undefined }],
            [{ "card": "A9o", "action": undefined }, { "card": "K9o", "action": undefined }, { "card": "Q9o", "action": undefined }, { "card": "J9o", "action": undefined }, { "card": "T9o", "action": undefined }, { "card": "99", "action": undefined }, { "card": "98s", "action": undefined }, { "card": "97s", "action": undefined }, { "card": "96s", "action": undefined }, { "card": "95s", "action": undefined }, { "card": "94s", "action": undefined }, { "card": "93s", "action": undefined }, { "card": "92s", "action": undefined }],
            [{ "card": "A8o", "action": undefined }, { "card": "K8o", "action": undefined }, { "card": "Q8o", "action": undefined }, { "card": "J8o", "action": undefined }, { "card": "T8o", "action": undefined }, { "card": "98o", "action": undefined }, { "card": "88", "action": undefined }, { "card": "87s", "action": undefined }, { "card": "86s", "action": undefined }, { "card": "85s", "action": undefined }, { "card": "84s", "action": undefined }, { "card": "83s", "action": undefined }, { "card": "82s", "action": undefined }],
            [{ "card": "A7o", "action": undefined }, { "card": "K7o", "action": undefined }, { "card": "Q7o", "action": undefined }, { "card": "J7o", "action": undefined }, { "card": "T7o", "action": undefined }, { "card": "97o", "action": undefined }, { "card": "87o", "action": undefined }, { "card": "77", "action": undefined }, { "card": "76s", "action": undefined }, { "card": "75s", "action": undefined }, { "card": "74s", "action": undefined }, { "card": "73s", "action": undefined }, { "card": "72s", "action": undefined }],
            [{ "card": "A6o", "action": undefined }, { "card": "K6o", "action": undefined }, { "card": "Q6o", "action": undefined }, { "card": "J6o", "action": undefined }, { "card": "T6o", "action": undefined }, { "card": "96o", "action": undefined }, { "card": "86o", "action": undefined }, { "card": "76o", "action": undefined }, { "card": "66", "action": undefined }, { "card": "65s", "action": undefined }, { "card": "64s", "action": undefined }, { "card": "63s", "action": undefined }, { "card": "62s", "action": undefined }],
            [{ "card": "A5o", "action": undefined }, { "card": "K5o", "action": undefined }, { "card": "Q5o", "action": undefined }, { "card": "J5o", "action": undefined }, { "card": "T5o", "action": undefined }, { "card": "95o", "action": undefined }, { "card": "85o", "action": undefined }, { "card": "75o", "action": undefined }, { "card": "65o", "action": undefined }, { "card": "55", "action": undefined }, { "card": "54s", "action": undefined }, { "card": "53s", "action": undefined }, { "card": "52s", "action": undefined }],
            [{ "card": "A4o", "action": undefined }, { "card": "K4o", "action": undefined }, { "card": "Q4o", "action": undefined }, { "card": "J4o", "action": undefined }, { "card": "T4o", "action": undefined }, { "card": "94o", "action": undefined }, { "card": "84o", "action": undefined }, { "card": "74o", "action": undefined }, { "card": "64o", "action": undefined }, { "card": "54o", "action": undefined }, { "card": "44", "action": undefined }, { "card": "43s", "action": undefined }, { "card": "42s", "action": undefined }],
            [{ "card": "A3o", "action": undefined }, { "card": "K3o", "action": undefined }, { "card": "Q3o", "action": undefined }, { "card": "J3o", "action": undefined }, { "card": "T3o", "action": undefined }, { "card": "93o", "action": undefined }, { "card": "83o", "action": undefined }, { "card": "73o", "action": undefined }, { "card": "63o", "action": undefined }, { "card": "53o", "action": undefined }, { "card": "43o", "action": undefined }, { "card": "33", "action": undefined }, { "card": "32s", "action": undefined }],
            [{ "card": "A2o", "action": undefined }, { "card": "K2o", "action": undefined }, { "card": "Q2o", "action": undefined }, { "card": "J2o", "action": undefined }, { "card": "T2o", "action": undefined }, { "card": "92o", "action": undefined }, { "card": "82o", "action": undefined }, { "card": "72o", "action": undefined }, { "card": "62o", "action": undefined }, { "card": "52o", "action": undefined }, { "card": "42o", "action": undefined }, { "card": "32o", "action": undefined }, { "card": "22", "action": undefined }]
        ]
    }

    constructor() { }

    cellBackground(action: Action, actionSituations: Action[]) {
        if (action.type === "unique") {
            return `linear-gradient(to right, ${action.color} 0%, ${action.color} 100%)`;
        } else if (action.type === "mixed") {
            let gradient = "linear-gradient(to right";
            let total = 0;
            action.colorList!.map((d: any) => {
                let goodColor = actionSituations.filter(action => action.id === d.color)[0];
                total += d.percent;
                gradient += `, ${goodColor.color} ${total - d.percent}%, ${goodColor.color} ${total}%`
            });
            gradient += ")";
            return gradient;
        }
        return '';
    }
}
