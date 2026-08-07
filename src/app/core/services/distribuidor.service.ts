import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Distribuidor, CreateDistribuidorDto } from '../models/distribuidor.model';

@Injectable({
  providedIn: 'root'
})
export class DistribuidorService {
  private apiUrl = `${environment.apiUrl}/distribuidores`;

  constructor(private http: HttpClient) {}

  createDistribuidor(data: CreateDistribuidorDto): Observable<Distribuidor> {
    return this.http.post<Distribuidor>(this.apiUrl, data);
  }

  changeCategory(id: string, categoryId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/category`, { categoryId });
  }

  changeCoordinator(id: string, coordId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/coord-change`, { coordId });
  }
}
