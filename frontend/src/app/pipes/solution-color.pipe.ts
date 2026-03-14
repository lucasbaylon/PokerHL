import { Pipe, PipeTransform } from '@angular/core';
import { Solution } from '../interfaces/solution';
import { CommonService } from '../services/common.service';

@Pipe({
    name: 'solutionColor',
    standalone: true
})
export class SolutionColorPipe implements PipeTransform {

    constructor(private commonService: CommonService) { }

    /**
     * Retourne le dégradé CSS correspondant à une solution donnée.
     * @param value Identifiant de la solution.
     * @param solution_colors Liste des solutions disponibles pour extraire les couleurs.
     * @returns Chaîne CSS pour le background-image.
     */
    transform(value: string, solution_colors: Solution[]): string {
        let item = solution_colors.filter((item: any) => item.id === value);
        if (item.length === 1) return this.commonService.cellBackground(item[0], solution_colors);
        return "";
    }

}
