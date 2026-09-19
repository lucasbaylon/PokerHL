import { Component, Input, OnChanges } from '@angular/core';
import { Situation } from '../../interfaces/situation';
import { CommonService } from '../../services/common.service';
import { buildAllInGrid, thresholdColor } from './all-in-grid';
import { TooltipModule } from 'primeng/tooltip';

@Component({
    selector: 'app-all-in-grid',
    standalone: true,
    imports: [TooltipModule],
    templateUrl: './all-in-grid.component.html',
    styles: [`
        :host { display: block; }
        th, td { padding: 0; }
        td {
            transition: box-shadow 160ms ease-out;
        }
        td:hover, td:focus-visible {
            z-index: 20;
            box-shadow: 0 0 0 2px #fff, 0 0 0 4px #fb7185, 0 6px 16px rgba(0, 0, 0, 0.3);
        }
        td:focus-visible { outline: 2px solid transparent; outline-offset: 4px; }
        @media (prefers-reduced-motion: reduce) {
            td { transition: none; }
        }
    `]
})
export class AllInGridComponent implements OnChanges {
    @Input() situations: Situation[] = [];
    @Input() cellSize = 34;
    readonly ranks = 'AKQJT98765432'.split('');
    readonly steps = Array.from({ length: 30 }, (_, i) => 0.5 + i / 2);
    readonly color = thresholdColor;
    grid = buildAllInGrid([]);

    constructor(private commonService: CommonService) {}

    get fontSize(): number {
        return 14 + { small: 0, medium: 1, large: 3 }[this.commonService.getRangeFontSize()];
    }

    ngOnChanges(): void {
        const situations = this.situations.map(situation => ({
            ...situation,
            solutions: this.commonService.migrateSolutions(situation.solutions.map(solution => ({ ...solution })))
        }));
        this.grid = buildAllInGrid(situations);
    }
}
