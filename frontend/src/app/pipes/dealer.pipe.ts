import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'dealer'
})
export class DealerPipe implements PipeTransform {

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
