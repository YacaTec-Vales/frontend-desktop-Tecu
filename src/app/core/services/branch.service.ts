import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Branch, CreateBranchDto, UpdateBranchDto } from '../models/branch.model';

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private apiUrl = `${environment.apiUrl}/branches`;

  constructor(private http: HttpClient) {}

  getBranches(): Observable<Branch[]> {
    return this.http.get<{data: {data: Branch[]}}>(this.apiUrl).pipe(
      map(res => res.data.data)
    );
  }

  getBranch(id: string): Observable<Branch> {
    return this.http.get<Branch>(`${this.apiUrl}/${id}`);
  }

  createBranch(data: CreateBranchDto): Observable<Branch> {
    return this.http.post<{data: Branch}>(this.apiUrl, data).pipe(
      map(res => res.data)
    );
  }

  updateBranch(id: string, data: UpdateBranchDto): Observable<Branch> {
    return this.http.patch<{data: Branch}>(`${this.apiUrl}/${id}`, data).pipe(
      map(res => res.data)
    );
  }

  deleteBranch(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
