from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database_sql import get_db
import models
from email_utils import send_overdue_email

router = APIRouter()

@router.post("/overdue")
def trigger_overdue_notifications(db: Session = Depends(get_db)):
    """
    Finds all overdue books and sends an email notification to the user who borrowed them.
    An admin-only endpoint. (For simplicity in this demo, it's open, but normally depends on AdminRole)
    """
    now = datetime.now()
    
    # Find all books that are issued and past their expected return date
    overdue_books = db.query(models.Book).filter(
        models.Book.is_issued == True,
        models.Book.expected_return_date < now
    ).all()
    
    if not overdue_books:
        return {"message": "No overdue books found.", "emails_sent": 0}
        
    emails_sent = 0
    errors = 0
    notified_users = []
    
    for book in overdue_books:
        if not book.issued_to:
            continue
            
        user = db.query(models.User).filter(models.User.username == book.issued_to).first()
        if user and user.email:
            formatted_date = book.expected_return_date.strftime("%Y-%m-%d")
            success = send_overdue_email(
                to_email=user.email,
                username=user.username,
                book_title=book.title,
                expected_return_date=formatted_date
            )
            if success:
                emails_sent += 1
                notified_users.append(user.username)
            else:
                errors += 1
                
    return {
        "message": "Overdue notification process completed.",
        "overdue_books_found": len(overdue_books),
        "emails_sent": emails_sent,
        "emails_failed": errors,
        "notified_users": notified_users
    }
