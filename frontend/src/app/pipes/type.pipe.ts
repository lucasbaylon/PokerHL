import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'type',
    standalone: true
})
export class TypePipe implements PipeTransform {

    /**
     * Transforme le type de situation en nom d'affichage lisible.
     * @param value Code du type ('preflop', 'flop', 'turn', 'river').
     * @returns Nom d'affichage ou undefined.
     */
    transform(value: string): string | undefined {
        const names: Record<string, string> = { preflop: 'Pré-flop', flop: 'Flop', turn: 'Turn', river: 'River' };
        return names[value];
    }

}
