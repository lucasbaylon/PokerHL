import { Pipe, PipeTransform } from '@angular/core';
import { CommonService } from '../services/common.service';
import { Action } from '../interfaces/action';

@Pipe({
    name: 'actionColor'
})
export class ActionColorPipe implements PipeTransform {

    constructor(private apiCommon: CommonService) { }

    transform(value: string, action_colors: Action[]): string {
        let item = action_colors.filter((item: any) => item.id === value);
        if (item.length === 1) return this.apiCommon.cellBackground(item[0], action_colors);
        return "";
    }

}
