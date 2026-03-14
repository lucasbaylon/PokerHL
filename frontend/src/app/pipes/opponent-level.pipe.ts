import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'opponentLevel',
    standalone: true
})
export class OpponentLevelPipe implements PipeTransform {

    /**
     * Transforme le code du niveau de l'adversaire en nom d'affichage.
     * @param value Code du niveau ('fish', 'shark', 'fish_shark').
     * @returns Nom d'affichage ou undefined.
     */
    transform(value: string): string | undefined {
        if (value === "fish") {
            return "Fish"
        } else if (value === "shark") {
            return "Reg"
        } else if (value === "fish_shark") {
            return "Fish/Reg"
        }
        return undefined;
    }

}
