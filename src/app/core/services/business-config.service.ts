import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BusinessConfigItem, BusinessConfigPatchDto } from '../models/business-config.model';

@Injectable({
  providedIn: 'root'
})
export class BusinessConfigService {
  private apiUrl = `${environment.apiUrl}/business-config`;

  constructor(private http: HttpClient) {}

  getConfig(): Observable<BusinessConfigItem[]> {
    return this.http.get<{ message: string, data: BusinessConfigItem[] }>(this.apiUrl)
      .pipe(map(res => res.data));
  }

  updateConfig(data: BusinessConfigPatchDto): Observable<BusinessConfigItem[]> {
    return this.http.patch<{ message: string, data: BusinessConfigItem[] }>(this.apiUrl, data)
      .pipe(map(res => res.data));
  }
}
