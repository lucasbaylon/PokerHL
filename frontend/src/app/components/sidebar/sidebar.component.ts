import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommonService } from '../../services/common.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './sidebar.component.html',
})
export class SidebarComponent {

    constructor(
        protected commonService: CommonService,
    ) { }

    /**
    * Inverse la valeur de la propriété `isCollapsed`,
    * permettant d'afficher ou de masquer la barre latérale.
    */
    toggleSidebar() {
        this.commonService.isCollapsed = !this.commonService.isCollapsed;
    }
}