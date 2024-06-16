import { NgStyle } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'card',
    standalone: true,
    imports: [NgStyle],
    templateUrl: './card.component.html'
})
export class CardComponent {

    @Input() cardColor!: string;
    @Input() cardColorName!: string;
    @Input() cardValue!: string;

}
