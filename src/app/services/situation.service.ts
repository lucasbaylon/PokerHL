import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Socket } from 'ngx-socket-io';

@Injectable({
    providedIn: 'root'
})
export class SituationService {

    situations = this.socket.fromEvent<[]>('Situations');

    constructor(private http: HttpClient, private socket: Socket) { }

    checkSituation() {
        return this.http.get("/api/check_situations_folder");
    }

    getSituations() {
        this.socket.emit('GetSituations');
    }

    addSituation(data: any) {
        this.socket.emit('AddSituation', data);
    }
}
