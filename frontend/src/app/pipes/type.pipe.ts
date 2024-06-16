import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'type',
    standalone: true
})
export class TypePipe implements PipeTransform {

    transform(value: string): string | undefined {
        if (value === "preflop") {
            return "Pré-flop";
        } else if (value === "flop") {
            return "Flop";
        }
        return undefined;
    }

}
