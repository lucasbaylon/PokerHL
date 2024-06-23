import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { Situation } from '../../interfaces/situation';
import { CommonService } from '../../services/common.service';

@Component({
    selector: 'app-select-training-mode',
    standalone: true,
    imports: [FormsModule, InputNumberModule, FloatLabelModule],
    templateUrl: './select-training-mode.component.html'
})
export class SelectTrainingModeComponent {

    situationList: Situation[] = [];

    heure: number = 0;
    minute: number = 0;
    seconds: number = 10;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private commonService: CommonService
    ) { }

    ngOnInit() {
        if (this.activatedRoute.snapshot.params.hasOwnProperty('situationList')) {
            this.situationList = JSON.parse(this.activatedRoute.snapshot.params['situationList']);
            const currentUrl = this.router.url;
            const baseUrl = currentUrl.split(';')[0];
            this.router.navigateByUrl(baseUrl);
        }
    }

    onSelectMode(mode: string) {
        switch (mode) {
            case 'infinite':
                this.router.navigate(['/training', { situationList: JSON.stringify(this.situationList), mode: 'infinite' }]);
                break;
            case 'turbo':
                this.commonService.showModal('turbo-timer-modal');
                break;
            case 'challenge':
                this.commonService.showSwalToast("Bientôt disponible.", "info");
                break;
            default:
                break;
        }
    }

    startTurboSession() {
        this.router.navigate(['/training', { situationList: JSON.stringify(this.situationList), mode: 'turbo', timer: JSON.stringify({ heure: this.heure, minute: this.minute, seconds: this.seconds }) }]);
    }

}
