import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) { }

  getBooks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/books`);
  }

  addBook(bookData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/books`, bookData);
  }

  getRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/requests`);
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  requestBook(bookId: number, durationWeeks: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/requests`, { book_id: bookId, duration_weeks: durationWeeks });
  }

  directIssue(bookId: number, issueData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/books/${bookId}/issue`, issueData);
  }

  approveRequest(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/requests/${requestId}`, { action: 'approve' });
  }

  rejectRequest(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/requests/${requestId}`, { action: 'reject' });
  }

  getQrCode(bookId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/books/${bookId}/qr`);
  }
}
