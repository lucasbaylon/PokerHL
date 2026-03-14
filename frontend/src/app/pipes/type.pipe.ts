import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'type',
    standalone: true
})
export class TypePipe implements PipeTransform {

    /**
     * Transforme le type de situation en nom d'affichage lisible.
     * @param value Code du type ('preflop', 'flop').
     * @returns Nom d'affichage ou undefined.
     */
    transform(value: string): string | undefined {
        if (value === "preflop") {
            return "Pré-flop";
        } else if (value === "flop") {
            return "Flop";
        }
        return undefined;
    }

}
