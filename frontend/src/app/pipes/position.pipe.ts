import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'position',
    standalone: true
})
export class PositionPipe implements PipeTransform {

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
