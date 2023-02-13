import { Pipe, PipeTransform } from '@angular/core';
import { Action } from '../interfaces/action';
import { CommonService } from '../services/common.service';

@Pipe({
    name: 'actionColor'
})
export class ActionColorPipe implements PipeTransform {

    constructor(private apiCommon: CommonService) { }

    transform(value: string, action_colors: Action[]): string {
        let item = action_colors.filter((item: any) => item.id === value);
        return this.apiCommon.cellBackground(item[0]?.color);
    }

}
