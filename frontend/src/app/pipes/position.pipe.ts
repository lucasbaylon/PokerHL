import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'position',
    standalone: true
})
export class PositionPipe implements PipeTransform {

    transform(value: string): string | undefined {
        if (value === "sb") {
            return "Small Blind";
        } else if (value === "bb") {
            return "Big Blind";
        } else if (value === "bu") {
            return "Bouton";
        }
        return undefined;
    }

}
