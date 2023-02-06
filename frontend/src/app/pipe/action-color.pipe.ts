import { Pipe, PipeTransform } from '@angular/core';
import { Action } from '../interfaces/action';

@Pipe({
    name: 'actionColor'
})
export class ActionColorPipe implements PipeTransform {

    transform(value: string, action_colors: Action[]): string {
        let item = action_colors.filter((item: any) => item.id === value);
        return item[0]?.color!;
    }

}
