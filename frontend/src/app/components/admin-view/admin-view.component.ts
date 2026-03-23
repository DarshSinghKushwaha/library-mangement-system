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
  activeTab: 'books' | 'activity' = 'books';
  searchFilter: string = 'all';
  isSidebarCollapsed: boolean = false;

  currentPage: number = 1;
  itemsPerPage: number = 8;

  loggedInUser: string = 'Admin';
  isDarkMode: boolean = false;

  // Paginated books state
  allBooksCache: any[] = [];
  books: any[] = [];
  isLoadingBooks = false;
  totalBooks = 0;

  // Requests (not paginated)
  requests: any[] = [];

  // Search
  searchQuery: string = '';
  private searchSubject = new Subject<string>();

  get filteredActivity(): any[] {
    const items = this.activityItems;
    if (!this.searchQuery.trim()) return items;
    const q = this.searchQuery.toLowerCase();
    
    return items.filter(r => {
      if (this.searchFilter === 'username') return r.username?.toLowerCase().includes(q);
      if (this.searchFilter === 'book_name') return r.book_title?.toLowerCase().includes(q) || String(r.book_id).includes(q);
      if (this.searchFilter === 'category') return r.category?.toLowerCase().includes(q);
      if (this.searchFilter === 'return_date') return String(r.expected_return_date).includes(q);
      
      // 'all'
      return r.username?.toLowerCase().includes(q) ||
        r.book_title?.toLowerCase().includes(q) ||
        String(r.book_id).includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        String(r.expected_return_date).includes(q);
    });
  }

  activityItems: any[] = [];

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
    this.loggedInUser = localStorage.getItem('username') || localStorage.getItem('role') || 'Admin';
    if (this.loggedInUser) {
        this.loggedInUser = this.loggedInUser.charAt(0).toUpperCase() + this.loggedInUser.slice(1);
    }

    this.isDarkMode = localStorage.getItem('theme') === 'dark';
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    this.loadBooksPaginated();
    this.loadActivity();
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
    // Numbered pagination replaces intersection observer
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }

  onSearchChange() {
    this.searchSubject.next(this.searchQuery);
  }

  resetAndReload() {
    this.books = [];
    this.currentPage = 1;
    this.allBooksCache = []; // Force fresh fetch 
    this.loadBooksPaginated();
  }

  loadBooksPaginated() {
    if (this.isLoadingBooks) return;
    this.isLoadingBooks = true;

    // Fast client-side pagination if data is locally populated
    if (this.allBooksCache.length > 0) {
      this.applyLocalPagination();
      return;
    }

    // Otherwise, fetch ALL books exactly once and store in cache
    this.bookService.getBooks().subscribe({
      next: (res) => {
        this.allBooksCache = res;
        this.applyLocalPagination();
      },
      error: () => {
        this.isLoadingBooks = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyLocalPagination() {
    try {
      const q = (this.searchQuery || '').trim().toLowerCase();
      
      // Filter locally based on search safely
      const filtered = q ? this.allBooksCache.filter(b => 
         (b.title?.toLowerCase() || '').includes(q) || 
         (b.author?.toLowerCase() || '').includes(q) || 
         (b.category?.toLowerCase() || '').includes(q)
      ) : this.allBooksCache;

      this.totalBooks = filtered.length;

      // Slice for current page (e.g. 0 to 8)
      const offset = (this.currentPage - 1) * this.itemsPerPage;
      this.books = filtered.slice(offset, offset + this.itemsPerPage);
    } catch (e) {
      console.error('Error applying pagination filter: ', e);
    } finally {
      // Minor simulated delay for smooth animation transition
      setTimeout(() => {
          this.isLoadingBooks = false;
          this.cdr.detectChanges();
      }, 400);
    }
  }

  goToPage(page: number) {
    if (page < 1 || (this.totalBooks && page > Math.ceil(this.totalBooks / this.itemsPerPage))) return;
    this.currentPage = page;
    
    // Slight artificial delay to trigger smooth loader properly on instant cache hits
    this.isLoadingBooks = true; 
    setTimeout(() => this.applyLocalPagination(), 50);
  }

  get totalPages(): number {
    return Math.ceil(this.totalBooks / this.itemsPerPage) || 1;
  }

  // --- Activity (Requests + Issuances) ---
  loadActivity() {
    // Fetch requests and all books to find active issuances
    this.bookService.getRequests().subscribe(reqs => {
      this.bookService.getBooks().subscribe(books => {
        const issuances = books
          .filter(b => b.is_issued)
          .map(b => ({
            id: -1, // No request ID for direct issuance
            book_id: b.id,
            book_title: b.title,
            category: b.category,
            username: b.issued_to,
            request_date: b.issued_date,
            expected_return_date: b.expected_return_date,
            status: 'active',
            display_status: 'Currently Issued'
          }));

        const requests = reqs.map(r => {
          const matchedBook = books.find(b => b.id === r.book_id);
          return {
            ...r,
            category: matchedBook ? matchedBook.category : '',
            display_status: r.status.charAt(0).toUpperCase() + r.status.slice(1)
          };
        });

        // Combine and sort by date descending
        this.activityItems = [...requests, ...issuances].sort((a, b) => 
          new Date(b.request_date || 0).getTime() - new Date(a.request_date || 0).getTime()
        );
        this.cdr.detectChanges();
      });
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
      this.loadActivity();
      this.resetAndReload();
    });
  }

  rejectReq(id: number) {
    this.bookService.rejectRequest(id).subscribe(() => {
      this.loadActivity();
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
      this.loadActivity();
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

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
}
