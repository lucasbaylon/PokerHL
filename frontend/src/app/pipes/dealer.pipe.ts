import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'dealer',
    standalone: true
})
export class DealerPipe implements PipeTransform {

    /**
     * Transforme le code du dealer en nom d'affichage.
     * @param value Code du dealer ('you', 'opponent1', 'opponent2').
     * @returns Nom d'affichage ou undefined.
     */
    transform(value: string): string | undefined {
        if (value === "you") {
            return "Vous"
        } else if (value === "opponent1") {
            return "Adversaire 1"
        } else if (value === "opponent2") {
            return "Adversaire 2"
        }
        return undefined;
    }

}
