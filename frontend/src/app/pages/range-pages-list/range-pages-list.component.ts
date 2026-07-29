import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { RangePage } from '../../interfaces/range-page';
import { CommonService } from '../../services/common.service';
import { RangePageService } from '../../services/range-page.service';

@Component({
    selector: 'app-range-pages-list',
    standalone: true,
    imports: [TableModule],
    templateUrl: './range-pages-list.component.html'
})
export class RangePagesListComponent implements AfterViewInit, OnInit, OnDestroy {

    private rangePagesSubscription!: Subscription;
    private resizeFrameId?: number;
    private readonly defaultHeaderHeight = 56;
    private readonly defaultPaginatorHeight = 56;
    private readonly defaultRowHeight = 65;
    private readonly minRowsPerPage = 4;
    private readonly pageBottomSpacing = 24;
    rangePages: RangePage[] = [];
    nbRowsPerPage = 11;

    @ViewChild('tableContainer') tableContainer!: ElementRef<HTMLElement>;

    constructor(
        private router: Router,
        private rangePageService: RangePageService,
        protected commonService: CommonService
    ) { }

    /** Ajuste le nombre de lignes au redimensionnement de la fenêtre. */
    @HostListener('window:resize')
    onResize() {
        this.scheduleRowsPerPageUpdate();
    }

    ngAfterViewInit(): void {
        this.scheduleRowsPerPageUpdate();
    }

    ngOnInit(): void {
        this.rangePagesSubscription = this.rangePageService.rangePages.subscribe((data: RangePage[]) => {
            this.rangePages = data.sort((a, b) => a.name.localeCompare(b.name));
            this.scheduleRowsPerPageUpdate();
        });
        this.rangePageService.getRangePages();
    }

    ngOnDestroy(): void {
        this.rangePagesSubscription.unsubscribe();

        if (this.resizeFrameId !== undefined) {
            cancelAnimationFrame(this.resizeFrameId);
        }
    }

    private scheduleRowsPerPageUpdate() {
        if (this.resizeFrameId !== undefined) {
            cancelAnimationFrame(this.resizeFrameId);
        }

        this.resizeFrameId = requestAnimationFrame(() => {
            this.resizeFrameId = undefined;
            this.updateRowsPerPage();
        });
    }

    private updateRowsPerPage() {
        const tableElement = this.tableContainer?.nativeElement;

        if (!tableElement) {
            return;
        }

        const availableHeight = window.innerHeight - tableElement.getBoundingClientRect().top - this.pageBottomSpacing;
        const headerHeight = tableElement.querySelector('thead')?.getBoundingClientRect().height || this.defaultHeaderHeight;
        const rowHeight = tableElement.querySelector('tbody tr')?.getBoundingClientRect().height || this.defaultRowHeight;
        const rowsWithoutPaginator = Math.floor((availableHeight - headerHeight) / rowHeight);
        const needsPaginator = this.rangePages.length > rowsWithoutPaginator;
        const paginatorHeight = needsPaginator
            ? tableElement.querySelector('.p-paginator')?.getBoundingClientRect().height || this.defaultPaginatorHeight
            : 0;
        const rowsPerPage = Math.max(
            this.minRowsPerPage,
            Math.floor((availableHeight - headerHeight - paginatorHeight) / rowHeight)
        );

        this.nbRowsPerPage = rowsPerPage;
    }

    createPage() {
        const page: RangePage = {
            name: 'Nouvelle grille',
            blocks: [],
            displaySettings: {
                cellSize: 34,
                compact: false,
                showLegend: true
            }
        };

        this.rangePageService.addRangePage(page);
        this.commonService.showSwalToast('Page créée !');
    }

    openPage(id: number | undefined) {
        if (id === undefined) return;
        this.router.navigate(['range-page-editor', { page_id: id }]);
    }

    duplicatePage(id: number | undefined) {
        if (id === undefined) return;
        this.rangePageService.duplicateRangePage(id.toString());
        this.commonService.showSwalToast('Page dupliquée !');
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
                this.commonService.showSwalToast('Page supprimée !');
            }
        });
    }
}
