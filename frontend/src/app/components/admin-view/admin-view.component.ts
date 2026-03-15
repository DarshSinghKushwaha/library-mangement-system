import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../services/book.service';
import { AuthService } from '../../services/auth.service';
import { BookCardComponent } from '../book-card/book-card.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-admin-view',
  standalone: true,
  imports: [CommonModule, FormsModule, BookCardComponent],
  templateUrl: './admin-view.component.html',
  styleUrls: []
})
export class AdminViewComponent implements OnInit {
  activeTab: 'books' | 'requests' = 'books';
  books: any[] = [];
  requests: any[] = [];
  users: string[] = [];
  
  qrCodeUrl: SafeResourceUrl | null = null;
  showQrModal = false;

  // Add Book state
  showAddBookModal = false;
  newBook = { title: '', author: '', category: '' };

  // Direct Issue state
  showIssueModal = false;
  issueData = { book_id: 0, username: '', duration_weeks: 1 };

  constructor(
    private bookService: BookService, 
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadBooks();
    this.loadRequests();
    this.loadUsers();
  }

  loadBooks() {
    this.bookService.getBooks().subscribe(res => {
      this.books = res;
      this.cdr.detectChanges();
    });
  }

  loadRequests() {
    this.bookService.getRequests().subscribe(res => {
      this.requests = res;
      this.cdr.detectChanges();
    });
  }

  loadUsers() {
    this.bookService.getUsers().subscribe(res => {
      this.users = res;
      if (this.users.length > 0) this.issueData.username = this.users[0];
      this.cdr.detectChanges();
    });
  }

  approveReq(id: number) {
    this.bookService.approveRequest(id).subscribe(() => {
         this.loadRequests();
         this.loadBooks();
    });
  }

  rejectReq(id: number) {
    this.bookService.rejectRequest(id).subscribe(() => {
         this.loadRequests();
    });
  }

  // --- Add Book Flow ---
  openAddBookModal() {
    this.newBook = { title: '', author: '', category: '' };
    this.showAddBookModal = true;
  }
  
  closeAddBookModal() {
    this.showAddBookModal = false;
  }

  submitAddBook() {
    if(!this.newBook.title || !this.newBook.author || !this.newBook.category) return;
    this.bookService.addBook(this.newBook).subscribe(res => {
      this.closeAddBookModal();
      this.loadBooks();
      // Auto generate view QR for new book
      this.viewQr(res.id);
    });
  }

  // --- Issue Book Flow ---
  openIssueModal(bookId: number) {
    this.issueData.book_id = bookId;
    this.issueData.duration_weeks = 1;
    if (this.users.length > 0) this.issueData.username = this.users[0];
    this.showIssueModal = true;
  }

  closeIssueModal() {
    this.showIssueModal = false;
  }

  submitIssue() {
    if(!this.issueData.username || this.issueData.duration_weeks < 1) return;
    const load = { username: this.issueData.username, duration_weeks: this.issueData.duration_weeks };
    this.bookService.directIssue(this.issueData.book_id, load).subscribe(() => {
      this.closeIssueModal();
      this.loadBooks();
    });
  }

  // --- QR Display Flow ---
  viewQr(bookId: number) {
    this.bookService.getQrCode(bookId).subscribe(res => {
      const imgUrl = 'data:image/png;base64,' + res.qr_image_base64;
      this.qrCodeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(imgUrl);
      this.showQrModal = true;
      this.cdr.detectChanges();
    });
  }

  closeQrModal() {
    this.showQrModal = false;
    this.qrCodeUrl = null;
  }

  printQr() {
    window.print();
  }

  logout() {
    this.authService.logout();
  }
}
