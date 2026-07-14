import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { RangePage } from '../../interfaces/range-page';
import { CommonService } from '../../services/common.service';
import { RangePageService } from '../../services/range-page.service';

@Component({
    selector: 'app-range-pages-list',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './range-pages-list.component.html'
})
export class RangePagesListComponent implements OnInit, OnDestroy {

    private rangePagesSubscription!: Subscription;
    rangePages: RangePage[] = [];
    newPageName = 'Nouvelle page';

    constructor(
        private router: Router,
        private rangePageService: RangePageService,
        protected commonService: CommonService
    ) { }

    ngOnInit(): void {
        this.rangePagesSubscription = this.rangePageService.rangePages.subscribe((data: RangePage[]) => {
            this.rangePages = data.sort((a, b) => a.name.localeCompare(b.name));
        });
        this.rangePageService.getRangePages();
    }

    ngOnDestroy(): void {
        this.rangePagesSubscription.unsubscribe();
    }

    createPage() {
        const page: RangePage = {
            name: this.newPageName || 'Nouvelle page',
            blocks: [],
            displaySettings: {
                cellSize: 34,
                compact: false,
                showLegend: true
            }
        };

        this.rangePageService.addRangePage(page);
        this.commonService.showSwalToast('Page creee !');
    }

    openPage(id: number | undefined) {
        if (id === undefined) return;
        this.router.navigate(['range-page-editor', { page_id: id }]);
    }

    duplicatePage(id: number | undefined) {
        if (id === undefined) return;
        this.rangePageService.duplicateRangePage(id.toString());
        this.commonService.showSwalToast('Page dupliquee !');
    }

    removePage(id: number | undefined) {
        if (id === undefined) return;

        Swal.fire({
            title: 'Attention !',
            text: 'Voulez vous vraiment supprimer cette page ?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#303030',
            cancelButtonColor: '#d74c4c',
            confirmButtonText: 'Oui, supprimer !',
            cancelButtonText: 'Annuler'
        }).then((result) => {
            if (result.isConfirmed) {
                this.rangePageService.removeRangePage(id.toString());
                this.commonService.showSwalToast('Page supprimee !');
            }
        });
    }
}
