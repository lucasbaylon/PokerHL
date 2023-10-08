import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Socket } from 'ngx-socket-io';
import { Situation } from '../interfaces/situation';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SituationService {

    situation = this.socket.fromEvent<string>('Situation');
    situations = this.socket.fromEvent<[]>('Situations');
    situationsForTraining = this.socket.fromEvent<[]>('SituationsForTraining');

    constructor(private http: HttpClient, private socket: Socket, private auth: AuthService) { }

    checkSituationForUser() {
        const actualUser = this.auth.getUser();
        return this.http.get(`/api/check_situations_for_user/${actualUser?.email}`);
    }

    checkSituationNameFromUser(name: string) {
        const actualUser = this.auth.getUser();
        return this.http.get(`/api/check_situation_name/${name}/${actualUser?.email}`);
    }

    checkChangeSituationNameFromUser(id: number, name: string) {
        const actualUser = this.auth.getUser();
        return this.http.get(`/api/check_change_situation_name/${id}/${name}/${actualUser?.email}`);
    }

    getSituations() {
        const actualUser = this.auth.getUser();
        this.socket.emit('GetSituations', actualUser?.email);
    }

    getSituation(id: string) {
        this.socket.emit('GetSituation', id);
    }

    addSituation(data: Situation) {
        const actualUser = this.auth.getUser();
        this.socket.emit('AddSituation', {data: data, user: actualUser?.email});
    }

    editSituation(data: Situation) {
        this.socket.emit('EditSituation', {data: data});
    }

    removeSituation(id: string) {
        const actualUser = this.auth.getUser();
        this.socket.emit('RemoveSituation', {id: id, user: actualUser?.email});
    }

    duplicateSituation(id: string) {
        const actualUser = this.auth.getUser();
        this.socket.emit('DuplicateSituation', {id: id, user: actualUser?.email});
    }

}
