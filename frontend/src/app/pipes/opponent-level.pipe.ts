import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'opponentLevel',
    standalone: true
})
export class OpponentLevelPipe implements PipeTransform {

    transform(value: string): string | undefined {
        if (value === "fish") {
            return "Débutant"
        } else if (value === "shark") {
            return "Confirmé"
        }
        return undefined;
    }

}
