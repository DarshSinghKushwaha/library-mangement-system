import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './book-card.component.html',
  styleUrls: []
})
export class BookCardComponent {
  @Input() book: any;
  @Input() role: string = 'user';
  @Output() viewQr: EventEmitter<number> = new EventEmitter();
  @Output() requestBook: EventEmitter<number> = new EventEmitter();
  @Output() issueBook: EventEmitter<number> = new EventEmitter();

  onViewQr() {
    this.viewQr.emit(this.book.id);
  }

  onRequestBook() {
    if(!this.book.is_issued) {
      this.requestBook.emit(this.book.id);
    }
  }

  onIssueBook() {
    if(!this.book.is_issued) {
      this.issueBook.emit(this.book.id);
    }
  }
}
