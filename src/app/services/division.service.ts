import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Division } from '../models/division.model';

@Injectable({
  providedIn: 'root'
})
export class DivisionService {
  private apiUrl = 'http://localhost:3000/divisions';

  constructor(private http: HttpClient) {}

  getDivisions(): Observable<Division[]> {
    return this.http.get<Division[]>(this.apiUrl);
  }
}