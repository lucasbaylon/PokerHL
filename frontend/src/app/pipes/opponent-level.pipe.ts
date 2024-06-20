import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'opponentLevel',
    standalone: true
})
export class OpponentLevelPipe implements PipeTransform {

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
