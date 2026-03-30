import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../services/book.service';
import { AuthService } from '../../services/auth.service';
import { BookCardComponent } from '../book-card/book-card.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-user-view',
  standalone: true,
  imports: [CommonModule, FormsModule, BookCardComponent],
  templateUrl: './user-view.component.html',
  styleUrls: []
})
export class UserViewComponent implements OnInit, OnDestroy, AfterViewInit {
  activeTab: 'available' | 'assigned' = 'available';
  isSidebarCollapsed: boolean = false;
  searchQuery: string = '';
  private searchSubject = new Subject<string>();
  
  isDarkMode: boolean = false;
  loggedInUser: string = 'User';

  // Paginated books state
  books: any[] = [];
  nextCursor: number | null = null;
  hasMore = true;
  isLoadingBooks = false;
  totalBooks = 0;
  private bookObserver!: IntersectionObserver;
  @ViewChild('bookSentinel') bookSentinel!: ElementRef;

  // Assigned books (filtered client-side from full list via separate call)
  assignedBooks: any[] = [];

  username: string | null = '';
  requestMessage: string | null = null;
  requestError: string | null = null;

  showRequestModal = false;
  requestData = { book_id: 0, duration_weeks: 1 };

  get filteredAssignedBooks(): any[] {
    if (!this.searchQuery.trim()) return this.assignedBooks;
    const q = this.searchQuery.toLowerCase();
    return this.assignedBooks.filter(b =>
      b.title?.toLowerCase().includes(q) ||
      b.author?.toLowerCase().includes(q) ||
      b.category?.toLowerCase().includes(q)
    );
  }

  constructor(
    private bookService: BookService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loggedInUser = localStorage.getItem('username') || 'User';
    if (this.loggedInUser) {
        this.loggedInUser = this.loggedInUser.charAt(0).toUpperCase() + this.loggedInUser.slice(1);
    }

    this.isDarkMode = localStorage.getItem('theme') === 'dark';
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    this.username = localStorage.getItem('username');
    this.loadBooksPaginated();
    this.loadAssignedBooks();

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

  setActiveTab(tab: 'available' | 'assigned') {
    this.activeTab = tab;
    if (tab === 'available') {
      setTimeout(() => this.observeSentinel(), 100);
    }
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
        setTimeout(() => {
          this.isLoadingBooks = false;
          this.cdr.detectChanges();
          this.observeSentinel();
        }, 200);
      },
      error: () => {
        this.isLoadingBooks = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadAssignedBooks() {
    this.bookService.getBooks().subscribe({
      next: (res) => {
        this.assignedBooks = res.filter(b => b.is_issued && b.issued_to === this.username);
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
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
      { 
        root: null, 
        rootMargin: '400px', 
        threshold: 0.1 
      }
    );
    setTimeout(() => this.observeSentinel(), 500);
  }

  private observeSentinel() {
    if (this.bookSentinel?.nativeElement) {
      this.bookObserver?.observe(this.bookSentinel.nativeElement);
    }
  }

  trackByBookId(index: number, book: any): number {
    return book.id;
  }

  openRequestModal(bookId: number) {
    this.requestData.book_id = bookId;
    this.requestData.duration_weeks = 1;
    this.showRequestModal = true;
  }

  closeRequestModal() {
    this.showRequestModal = false;
  }

  submitRequest() {
    if (this.requestData.duration_weeks < 1) return;

    this.requestMessage = null;
    this.requestError = null;
    this.bookService.requestBook(this.requestData.book_id, this.requestData.duration_weeks).subscribe({
      next: () => {
        this.requestMessage = 'Book issue request sent successfully.';
        this.closeRequestModal();
        this.resetAndReload();
        this.loadAssignedBooks();
        setTimeout(() => { this.requestMessage = null; this.cdr.detectChanges(); }, 3000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.requestError = err.error?.detail || 'Failed to request book.';
        this.closeRequestModal();
        setTimeout(() => { this.requestError = null; this.cdr.detectChanges(); }, 3000);
        this.cdr.detectChanges();
      }
    });
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
