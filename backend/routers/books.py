from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime, timedelta
import qrcode
import base64
from io import BytesIO

from database_sql import get_db
import models
from schemas import BookResponse, BookCreate, DirectIssueCreate

router = APIRouter()

@router.get("/paginated")
def get_books_paginated(
    cursor: Optional[int] = Query(None, description="ID of the last item from previous page"),
    limit: int = Query(12, ge=1, le=50, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Search query for title/author/category"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Book)
    
    # Apply search filter
    if search and search.strip():
        q = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Book.title.ilike(q),
                models.Book.author.ilike(q),
                models.Book.category.ilike(q)
            )
        )
        
    total = query.count()

    # Apply cursor
    if cursor is not None:
        query = query.filter(models.Book.id > cursor)

    # Order and limit
    items = query.order_by(models.Book.id.asc()).limit(limit).all()
    has_more = len(items) == limit and (query.offset(limit).first() is not None)
    next_cursor = items[-1].id if items and has_more else None

    # Convert to dict for response
    # We can use schemas directly with Pydantic's from_orm or just dump to dict
    return {
        "items": items,
        "next_cursor": next_cursor,
        "has_more": has_more,
        "total": total,
    }

@router.get("/", response_model=List[BookResponse])
def get_books(db: Session = Depends(get_db)):
    return db.query(models.Book).all()

@router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

@router.post("/", response_model=BookResponse)
def create_book(book: BookCreate, db: Session = Depends(get_db)):
    new_book = models.Book(
        title=book.title,
        author=book.author,
        category=book.category,
        quantity=book.quantity,
        is_issued=False,
        issued_to=None,
        issued_date=None,
        expected_return_date=None
    )
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book

@router.get("/{book_id}/qr")
def get_book_qr(book_id: int, db: Session = Depends(get_db)):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Create QR code data
    qr_data = f"http://192.168.1.10:4200/request/{book.id}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    return {"qr_image_base64": img_str}

@router.post("/{book_id}/issue", response_model=BookResponse)
def direct_issue(book_id: int, req: DirectIssueCreate, db: Session = Depends(get_db)):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.is_issued:
        raise HTTPException(status_code=400, detail="Book is already issued")
        
    user = db.query(models.User).filter(models.User.username == req.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    book.is_issued = True
    book.issued_to = req.username
    book.issued_date = datetime.now()
    return_time = datetime.now() + timedelta(weeks=req.duration_weeks)
    book.expected_return_date = return_time
    
    # Also create a record in the requests table for this transaction
    direct_req = models.Request(
        book_id=book.id,
        username=req.username,
        status="approved",
        request_date=datetime.now(),
        duration_weeks=req.duration_weeks,
        expected_return_date=return_time
    )
    db.add(direct_req)
    
    db.commit()
    db.refresh(book)
    return book
