import { Pipe, PipeTransform } from '@angular/core';
import { flopTypeName } from '../services/flop.service';

@Pipe({
    name: 'flopType',
    standalone: true
})
export class FlopTypePipe implements PipeTransform {

    /**
     * Transforme un ou plusieurs codes de type de flop en noms d'affichage.
     * @param value Code ou liste de codes ('dry_2_high', ...).
     * @returns Noms d'affichage séparés par des virgules, ou undefined.
     */
    transform(value: string | string[] | undefined): string | undefined {
        const codes = Array.isArray(value) ? value : value ? [value] : [];
        const names = codes.map(code => flopTypeName(code)).filter(Boolean);
        return names.length ? names.join(', ') : undefined;
    }

}
