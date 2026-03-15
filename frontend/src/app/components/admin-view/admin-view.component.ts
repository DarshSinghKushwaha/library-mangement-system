import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../services/book.service';
import { AuthService } from '../../services/auth.service';
import { BookCardComponent } from '../book-card/book-card.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-admin-view',
  standalone: true,
  imports: [CommonModule, FormsModule, BookCardComponent],
  templateUrl: './admin-view.component.html',
  styleUrls: []
})
export class AdminViewComponent implements OnInit, OnDestroy, AfterViewInit {
  activeTab: 'books' | 'requests' = 'books';

  // Paginated books state
  books: any[] = [];
  nextCursor: number | null = null;
  hasMore = true;
  isLoadingBooks = false;
  totalBooks = 0;
  private bookObserver!: IntersectionObserver;
  @ViewChild('bookSentinel') bookSentinel!: ElementRef;

  // Requests (not paginated)
  requests: any[] = [];

  // Search
  searchQuery: string = '';
  private searchSubject = new Subject<string>();

  get filteredRequests(): any[] {
    if (!this.searchQuery.trim()) return this.requests;
    const q = this.searchQuery.toLowerCase();
    return this.requests.filter(r =>
      r.username?.toLowerCase().includes(q) ||
      r.book_title?.toLowerCase().includes(q) ||
      String(r.book_id).includes(q)
    );
  }

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
    this.loadBooksPaginated();
    this.loadRequests();
    this.loadUsers();

    // Debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.resetAndReload();
    });
  }

  ngAfterViewInit() {
    this.setupIntersectionObserver();
  }

  ngOnDestroy() {
    this.bookObserver?.disconnect();
    this.searchSubject.complete();
  }

  onSearchChange() {
    this.searchSubject.next(this.searchQuery);
  }

  resetAndReload() {
    this.books = [];
    this.nextCursor = null;
    this.hasMore = true;
    this.loadBooksPaginated();
  }

  loadBooksPaginated() {
    if (this.isLoadingBooks || !this.hasMore) return;
    this.isLoadingBooks = true;

    const search = this.searchQuery.trim() || undefined;
    this.bookService.getBooksPaginated(this.nextCursor, 12, search).subscribe({
      next: (res) => {
        this.books = [...this.books, ...res.items];
        this.nextCursor = res.next_cursor;
        this.hasMore = res.has_more;
        this.totalBooks = res.total;
        this.isLoadingBooks = false;
        this.cdr.detectChanges();

        // Re-observe sentinel after DOM update
        setTimeout(() => this.observeSentinel(), 50);
      },
      error: () => {
        this.isLoadingBooks = false;
        this.cdr.detectChanges();
      }
    });
  }

  private setupIntersectionObserver() {
    this.bookObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.isLoadingBooks && this.hasMore) {
            this.loadBooksPaginated();
          }
        });
      },
      { root: null, rootMargin: '0px 200px 0px 0px', threshold: 0.1 }
    );
    this.observeSentinel();
  }

  private observeSentinel() {
    if (this.bookSentinel?.nativeElement) {
      this.bookObserver?.observe(this.bookSentinel.nativeElement);
    }
  }

  // --- Non-paginated methods (requests, users) ---
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
      this.resetAndReload();
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
    if (!this.newBook.title || !this.newBook.author || !this.newBook.category) return;
    this.bookService.addBook(this.newBook).subscribe(res => {
      this.closeAddBookModal();
      this.resetAndReload();
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
    if (!this.issueData.username || this.issueData.duration_weeks < 1) return;
    const load = { username: this.issueData.username, duration_weeks: this.issueData.duration_weeks };
    this.bookService.directIssue(this.issueData.book_id, load).subscribe(() => {
      this.closeIssueModal();
      this.resetAndReload();
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

  trackByBookId(index: number, book: any): number {
    return book.id;
  }

  logout() {
    this.authService.logout();
  }
}
