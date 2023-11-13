import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Socket } from 'ngx-socket-io';
import { Situation } from '../interfaces/situation';
import { AuthService } from './auth.service';
import { saveAs } from 'file-saver';
import { Observable } from 'rxjs';

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
        this.socket.emit('AddSituation', { data: data, user: actualUser?.email });
    }

    editSituation(data: Situation) {
        this.socket.emit('EditSituation', { data: data });
    }

    removeSituation(id: string) {
        const actualUser = this.auth.getUser();
        this.socket.emit('RemoveSituation', { id: id, user: actualUser?.email });
    }

    duplicateSituation(id: string) {
        const actualUser = this.auth.getUser();
        this.socket.emit('DuplicateSituation', { id: id, user: actualUser?.email });
    }

    exportSituationsForUser() {
        const actualUser = this.auth.getUser();
        this.http.get(`/api/export_situation/${actualUser?.email}`, { responseType: 'blob' }).subscribe(blob => {
            saveAs(blob, 'situations.zip');
        });
    }

    importZIPSituationsForUser(file: Blob): Observable<any> {
        const actualUser = this.auth.getUser();

        const formData: FormData = new FormData();
        formData.append('file', file, 'situations.zip');
        formData.append('user', actualUser?.email!);

        return this.http.post(`/api/import_zip_situation`, formData, {
            responseType: 'json'
        });
    }

    importJSONSituationsForUser(fileName: string, file: Blob): Observable<any> {
        const actualUser = this.auth.getUser();
        console.log(file as File);

        const formData: FormData = new FormData();
        formData.append('file', file);
        formData.append('user', actualUser?.email!);
        formData.append('fileName', fileName);

        return this.http.post(`/api/import_json_situation`, formData, {
            responseType: 'json'
        });
    }

}
