import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'position',
    standalone: true
})
export class PositionPipe implements PipeTransform {

    /**
     * Transforme le code de position en nom d'affichage (majuscules).
     * @param value Code de position ('sb', 'bb', 'bu').
     * @returns Nom d'affichage en majuscules ou undefined.
     */
    transform(value: string): string | undefined {
        if (value === "sb") {
            return "SB";
        } else if (value === "bb") {
            return "BB";
        } else if (value === "bu") {
            return "BU";
        }
        return undefined;
    }

}
