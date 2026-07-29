import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-modal',
    standalone: true,
    imports: [NgClass],
    templateUrl: './app-modal.component.html'
})
export class AppModalComponent {
    @Input() open = false;
    @Input() ariaLabelledBy?: string;
    @Input() panelClass = '';
    @Input() closeOnBackdrop = true;
    @Input() showClose = true;
    @Output() closed = new EventEmitter<void>();

    close() {
        this.closed.emit();
    }

    closeFromBackdrop() {
        if (this.closeOnBackdrop) {
            this.close();
        }
    }
}
