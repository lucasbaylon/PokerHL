import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class SituationService {

    constructor(private http: HttpClient) { }

    checkSituation() {
        return this.http.get("/api/check_situations_folder");
    }
}
