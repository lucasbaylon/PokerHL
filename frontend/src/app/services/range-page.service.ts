import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { RangePage } from '../interfaces/range-page';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class RangePageService {

    rangePage = this.socket.fromEvent<string>('RangePage');
    rangePages = this.socket.fromEvent<RangePage[]>('RangePages');

    constructor(private socket: Socket, private auth: AuthService) { }

    getRangePages() {
        const actualUser = this.auth.getUser();
        this.socket.emit('GetRangePages', actualUser?.email);
    }

    getRangePage(id: string) {
        const actualUser = this.auth.getUser();
        this.socket.emit('GetRangePage', { id, user: actualUser?.email });
    }

    addRangePage(data: RangePage) {
        const actualUser = this.auth.getUser();
        this.socket.emit('AddRangePage', { data, user: actualUser?.email });
    }

    editRangePage(data: RangePage) {
        const actualUser = this.auth.getUser();
        this.socket.emit('EditRangePage', { data, user: actualUser?.email });
    }

    removeRangePage(id: string) {
        const actualUser = this.auth.getUser();
        this.socket.emit('RemoveRangePage', { id, user: actualUser?.email });
    }

    duplicateRangePage(id: string) {
        const actualUser = this.auth.getUser();
        this.socket.emit('DuplicateRangePage', { id, user: actualUser?.email });
    }
}
