import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Socket } from 'ngx-socket-io';
import { Situation } from '../interfaces/situation';

@Injectable({
    providedIn: 'root'
})
export class SituationService {

    situation = this.socket.fromEvent<string>('Situation');
    situations = this.socket.fromEvent<[]>('Situations');
    situationsForTraining = this.socket.fromEvent<[]>('SituationsForTraining');

    constructor(private http: HttpClient, private socket: Socket) { }

    checkSituation() {
        return this.http.get("/api/check_situations_folder");
    }

    checkSituationID(id: string) {
        return this.http.get(`/api/check_situation_id/${id}`);
    }

    getSituations() {
        this.socket.emit('GetSituations');
    }

    getSituation(id: string) {
        this.socket.emit('GetSituation', id);
    }

    getSituationsForTraining(situationsList: Situation[]) {
        this.socket.emit('GetSituationsForTraining', situationsList);
    }

    addSituation(data: Situation, remove_file_obj: any) {
        this.socket.emit('AddSituation', {data: data, remove_file_obj: remove_file_obj});
    }

    removeSituation(id: string) {
        this.socket.emit('RemoveSituation', id);
    }

    duplicateSituation(id: string) {
        this.socket.emit('DuplicateSituation', id);
    }
}
