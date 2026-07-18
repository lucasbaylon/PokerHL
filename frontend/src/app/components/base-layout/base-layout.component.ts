import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonService } from '../../services/common.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
    selector: 'app-base-layout',
    standalone: true,
    imports: [RouterOutlet, NgClass, SidebarComponent],
    templateUrl: './base-layout.component.html',
})
export class BaseLayoutComponent {

    constructor(
        protected commonService: CommonService,
        private router: Router
    ) { }

    get isGridEditor(): boolean {
        return this.router.url.startsWith('/range-page-editor');
    }

}
