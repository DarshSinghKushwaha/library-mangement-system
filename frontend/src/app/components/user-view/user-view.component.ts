import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../services/book.service';
import { AuthService } from '../../services/auth.service';
import { BookCardComponent } from '../book-card/book-card.component';

@Component({
  selector: 'app-user-view',
  standalone: true,
  imports: [CommonModule, FormsModule, BookCardComponent],
  templateUrl: './user-view.component.html',
  styleUrls: []
})
export class UserViewComponent implements OnInit {
  activeTab: 'available' | 'assigned' = 'available';

  books: any[] = [];
  assignedBooks: any[] = [];
  
  username: string | null = '';
  requestMessage: string | null = null;
  requestError: string | null = null;

  showRequestModal = false;
  requestData = { book_id: 0, duration_weeks: 1 };

  constructor(
    private bookService: BookService, 
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.username = this.authService.getRole() === 'user' ? 'user1' : 'user'; 
    this.loadBooks();
  }

  loadBooks() {
    this.bookService.getBooks().subscribe({
      next: (res) => { 
        // Available books filter: everything not issued or issued but we still want to show all books
        // Wait, requested features say "assigned books displaying all books issued to user"
        this.books = res; 
        this.assignedBooks = res.filter(b => b.is_issued && b.issued_to === this.username);
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error(err)
    });
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
        this.loadBooks();
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
}
