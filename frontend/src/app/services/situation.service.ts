import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { AuthService } from './auth.service';
import { Situation } from '../interfaces/situation';
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

    /**
     * Vérifie si des situations existent pour l'utilisateur actuel.
     * @returns Observable de la requête HTTP.
     */
    checkSituationForUser() {
        const actualUser = this.auth.getUser();
        return this.http.get(`/api/check_situations_for_user/${actualUser?.email}`);
    }

    /**
     * Vérifie si un nom de situation est déjà utilisé par l'utilisateur.
     * @param name Nom à vérifier.
     * @returns Observable de la requête HTTP.
     */
    checkSituationNameFromUser(name: string) {
        const actualUser = this.auth.getUser();
        return this.http.get(`/api/check_situation_name/${name}/${actualUser?.email}`);
    }

    /**
     * Vérifie si on peut changer le nom d'une situation existante.
     * @param id Identifiant de la situation.
     * @param name Nouveau nom.
     * @returns Observable de la requête HTTP.
     */
    checkChangeSituationNameFromUser(id: number, name: string) {
        const actualUser = this.auth.getUser();
        return this.http.get(`/api/check_change_situation_name/${id}/${name}/${actualUser?.email}`);
    }

    /**
     * Récupère toutes les situations de l'utilisateur via socket.
     */
    getSituations() {
        const actualUser = this.auth.getUser();
        this.socket.emit('GetSituations', actualUser?.email);
    }

    /**
     * Récupère une situation spécifique par son identifiant.
     * @param id Identifiant de la situation.
     */
    getSituation(id: string) {
        this.socket.emit('GetSituation', id);
    }

    /**
     * Ajoute une nouvelle situation.
     * @param data Objet situation à ajouter.
     */
    addSituation(data: Situation) {
        console.log(data);
        const actualUser = this.auth.getUser();
        this.socket.emit('AddSituation', { data: data, user: actualUser?.email });
    }

    /**
     * Modifie une situation existante.
     * @param data Objet situation modifié.
     */
    editSituation(data: Situation) {
        this.socket.emit('EditSituation', { data: data });
    }

    /**
     * Supprime une situation.
     * @param id Identifiant de la situation.
     */
    removeSituation(id: string) {
        const actualUser = this.auth.getUser();
        this.socket.emit('RemoveSituation', { id: id, user: actualUser?.email });
    }

    /**
     * Duplique une situation existante.
     * @param id Identifiant de la situation à dupliquer.
     */
    duplicateSituation(id: string) {
        const actualUser = this.auth.getUser();
        this.socket.emit('DuplicateSituation', { id: id, user: actualUser?.email });
    }

    /**
     * Exporte toutes les situations de l'utilisateur en format ZIP.
     */
    exportSituationsForUser() {
        const actualUser = this.auth.getUser();
        this.http.get(`/api/export_situation/${actualUser?.email}`, { responseType: 'blob' }).subscribe(blob => {
            saveAs(blob, 'situations.zip');
        });
    }

    /**
     * Importe un fichier ZIP de situations.
     * @param file Fichier ZIP (Blob).
     * @returns Observable de la requête HTTP.
     */
    importZIPSituationsForUser(file: Blob): Observable<any> {
        const actualUser = this.auth.getUser();

        const formData: FormData = new FormData();
        formData.append('file', file, 'situations.zip');
        formData.append('user', actualUser?.email!);

        return this.http.post(`/api/import_zip_situation`, formData, {
            responseType: 'json'
        });
    }

    /**
     * Importe un fichier JSON de situations.
     * @param fileName Nom du fichier.
     * @param file Fichier JSON (Blob).
     * @returns Observable de la requête HTTP.
     */
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
