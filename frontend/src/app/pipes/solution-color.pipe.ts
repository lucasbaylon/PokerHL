import { Pipe, PipeTransform } from '@angular/core';
import { Solution } from '../interfaces/solution';
import { CommonService } from '../services/common.service';

@Pipe({
    name: 'solutionColor',
    standalone: true
})
export class SolutionColorPipe implements PipeTransform {

    constructor(private commonService: CommonService) { }

    transform(value: string, solution_colors: Solution[]): string {
        let item = solution_colors.filter((item: any) => item.id === value);
        if (item.length === 1) return this.commonService.cellBackground(item[0], solution_colors);
        return "";
    }

}
