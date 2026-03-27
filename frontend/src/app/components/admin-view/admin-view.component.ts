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
  activeTab: 'dashboard' | 'books' | 'activity' = 'dashboard';
  searchFilter: string = 'all';
  isSidebarCollapsed: boolean = false;

  currentPage: number = 1;
  itemsPerPage: number = 8;

  loggedInUser: string = 'Admin';
  isDarkMode: boolean = false;

  // Infinite scroll books state
  allBooksCache: any[] = [];
  books: any[] = [];
  isLoadingBooks = false;
  totalBooks = 0;
  
  loadedCount: number = 12;
  hasMore: boolean = true;
  private bookObserver!: IntersectionObserver;
  @ViewChild('adminBookSentinel') adminBookSentinel!: ElementRef;

  // Requests (not paginated)
  requests: any[] = [];
  
  // Dashboard Stats
  dashboardTotalBooks = 0;
  dashboardAvailableBooks = 0;
  dashboardIssuedBooks = 0;
  categoryStats: any[] = [];
  bestsellers: any[] = [];

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
  overdueItems: any[] = [];

  users: string[] = [];

  qrCodeUrl: SafeResourceUrl | null = null;
  showQrModal = false;

  // Add Book state
  showAddBookModal = false;
  newBook = { title: '', author: '', category: '', quantity: 1 };

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
    this.loggedInUser = localStorage.getItem('username') || 'Admin';
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
    this.setupIntersectionObserver();
  }

  ngOnDestroy() {
    this.bookObserver?.disconnect();
    this.searchSubject.complete();
  }

  onSearchChange() {
    this.searchSubject.next(this.searchQuery);
  }

  setActiveTab(tab: 'dashboard' | 'books' | 'activity') {
    this.activeTab = tab;
    if (tab === 'books') {
      setTimeout(() => this.observeSentinel(), 100);
    }
  }

  resetAndReload() {
    this.books = [];
    this.loadedCount = 12;
    this.hasMore = true;
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
        this.computeDashboardStats();
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
      this.hasMore = this.loadedCount < this.totalBooks;
      
      // Slice for infinite scroll (0 to loadedCount)
      this.books = filtered.slice(0, this.loadedCount);
    } catch (e) {
      console.error('Error applying pagination filter: ', e);
    } finally {
      // Minor simulated delay for smooth animation transition
      setTimeout(() => {
          this.isLoadingBooks = false;
          this.cdr.detectChanges();
          this.observeSentinel();
      }, 200);
    }
  }

  computeDashboardStats() {
    this.dashboardTotalBooks = this.allBooksCache.length;
    this.dashboardIssuedBooks = this.allBooksCache.filter(b => b.is_issued).length;
    this.dashboardAvailableBooks = this.dashboardTotalBooks - this.dashboardIssuedBooks;
    
    // Calculate Category Distribution
    const cats: { [key: string]: { total: number, issued: number } } = {};
    this.allBooksCache.forEach(b => {
      const c = b.category || 'Other';
      if (!cats[c]) cats[c] = { total: 0, issued: 0 };
      cats[c].total++;
      if (b.is_issued) cats[c].issued++;
    });
    
    this.categoryStats = Object.keys(cats).map(name => ({
      name,
      total: cats[name].total,
      issued: cats[name].issued,
      available: cats[name].total - cats[name].issued,
      percentage: cats[name].total > 0 ? Math.round((cats[name].issued / cats[name].total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
    
    // Calculate Bestsellers (Categories with highest issue rate)
    this.bestsellers = [...this.categoryStats]
       .filter(c => c.issued > 0)
       .sort((a, b) => b.issued - a.issued)
       .slice(0, 5);
  }

  loadMoreItems() {
    if (this.isLoadingBooks || !this.hasMore) return;
    this.isLoadingBooks = true;
    this.loadedCount += 12;
    this.applyLocalPagination();
  }

  private setupIntersectionObserver() {
    this.bookObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.isLoadingBooks && this.hasMore) {
            this.loadMoreItems();
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
    if (this.adminBookSentinel?.nativeElement) {
      this.bookObserver?.observe(this.adminBookSentinel.nativeElement);
    }
  }

  // --- Activity (Requests + Issuances) ---
  loadActivity() {
    this.bookService.getRequests().subscribe(reqs => {
      this.bookService.getBooks().subscribe(books => {
        const now = new Date();
        
        this.activityItems = reqs.map(r => {
          const matchedBook = books.find(b => b.id === r.book_id);
          const dueDate = r.expected_return_date ? new Date(r.expected_return_date) : null;
          const isOverdue = r.status === 'approved' && dueDate && dueDate < now;
          
          let displayStatus = r.status.charAt(0).toUpperCase() + r.status.slice(1);
          if (r.status === 'approved') {
            displayStatus = isOverdue ? 'OVERDUE' : 'Currently Issued';
          }

          return {
            ...r,
            category: matchedBook ? matchedBook.category : '',
            status: isOverdue ? 'overdue' : r.status,
            display_status: displayStatus
          };
        }).sort((a, b) => 
          new Date(b.request_date || 0).getTime() - new Date(a.request_date || 0).getTime()
        );
        
        this.overdueItems = this.activityItems.filter(i => i.status === 'overdue');
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
    this.newBook = { title: '', author: '', category: '', quantity: 1 };
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
