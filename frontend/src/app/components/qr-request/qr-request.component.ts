import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BookService } from '../../services/book.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-qr-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './qr-request.component.html',
  styleUrls: []
})
export class QrRequestComponent implements OnInit {
  bookId: number | null = null;
  book: any = null;
  
  isLoading = true;
  isSubmitting = false;
  error: string | null = null;
  success = false;

  isLoggedInAsUser = false;

  requestData = {
    username: '',
    password: '',
    duration_weeks: 1
  };

  constructor(
    private route: ActivatedRoute,
    private bookService: BookService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.checkAuth();
    
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.bookId = parseInt(idParam, 10);
        this.fetchBook();
      } else {
        this.error = "Invalid QR Code URL. Book ID is missing.";
        this.isLoading = false;
      }
    });
  }

  checkAuth() {
    const role = this.authService.getRole();
    if (role === 'user') {
      this.isLoggedInAsUser = true;
      this.requestData.username = localStorage.getItem('username') || 'user';
    } else {
      // Admin should not make user requests, force them to input creds or log out implicitly
      this.isLoggedInAsUser = false;
    }
  }

  fetchBook() {
    if (!this.bookId) return;
    
    this.isLoading = true;
    this.error = null;
    
    // We can use getBooks and filter since we don't have a public unauth book details endpoint yet unless getBooks is public.
    // If backend /api/books requires auth theoretically we might need to authenticate first. But CORS/FastAPI here allows anonymous reads if no Depends is set.
    this.bookService.getBooks().subscribe({
      next: (books) => {
        this.book = books.find(b => b.id === this.bookId);
        if (!this.book) {
          this.error = "The requested book could not be found in the catalog.";
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = "Failed to communicate with Library Server. Ensure you are on the correct WiFi.";
        this.isLoading = false;
      }
    });
  }

  submitRequest() {
    if (this.isSubmitting || !this.bookId) return;
    
    this.error = null;
    this.isSubmitting = true;

    // Routine 1: Authenticate if not already logged in
    if (!this.isLoggedInAsUser) {
      if (!this.requestData.username || !this.requestData.password) {
        this.error = "Please provide your username and password.";
        this.isSubmitting = false;
        return;
      }
      
      this.authService.login({
        username: this.requestData.username, 
        password: this.requestData.password
      }).subscribe({
        next: (res) => {
          if (res.role !== 'user') {
             this.error = "Admins cannot request books. Please login as a User.";
             this.authService.logout();
             this.isSubmitting = false;
          } else {
             this.isLoggedInAsUser = true;
             this.dispatchRequest();
          }
        },
        error: (err) => {
          this.error = "Invalid Credentials. Please check your username and password.";
          this.isSubmitting = false;
        }
      });
    } else {
      this.dispatchRequest();
    }
  }

  dispatchRequest() {
    if (!this.bookId) return;
    
    this.bookService.requestBook(this.bookId, this.requestData.duration_weeks).subscribe({
      next: () => {
        this.success = true;
        this.isSubmitting = false;
      },
      error: (err) => {
        this.error = err.error?.detail || "Failed to submit book request.";
        this.isSubmitting = false;
      }
    });
  }
}
