from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from schemas import BookResponse, BookCreate, DirectIssueCreate
from database import books_db, users_db
import qrcode
import base64
from io import BytesIO
import json

router = APIRouter()

@router.get("/paginated")
def get_books_paginated(
    cursor: Optional[int] = Query(None, description="ID of the last item from previous page"),
    limit: int = Query(12, ge=1, le=50, description="Number of items per page"),
    search: Optional[str] = Query(None, description="Search query for title/author/category"),
):
    # Filter by search if provided
    filtered = books_db
    if search and search.strip():
        q = search.lower().strip()
        filtered = [b for b in books_db if
                    q in b["title"].lower() or
                    q in b["author"].lower() or
                    q in b["category"].lower()]

    total = len(filtered)

    # Apply cursor: return items with id > cursor
    if cursor is not None:
        filtered = [b for b in filtered if b["id"] > cursor]

    # Take `limit` items
    page = filtered[:limit]
    has_more = len(filtered) > limit
    next_cursor = page[-1]["id"] if page and has_more else None

    return {
        "items": page,
        "next_cursor": next_cursor,
        "has_more": has_more,
        "total": total,
    }

@router.get("/", response_model=List[BookResponse])
def get_books():
    return books_db

@router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: int):
    book = next((b for b in books_db if b["id"] == book_id), None)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

@router.post("/", response_model=BookResponse)
def create_book(book: BookCreate):
    new_id = max((b["id"] for b in books_db), default=0) + 1
    new_book = {
        "id": new_id,
        "title": book.title,
        "author": book.author,
        "category": book.category,
        "is_issued": False,
        "issued_to": None,
        "issued_date": None,
        "expected_return_date": None
    }
    books_db.append(new_book)
    return new_book

@router.get("/{book_id}/qr")
def get_book_qr(book_id: int):
    book = next((b for b in books_db if b["id"] == book_id), None)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Create QR code data
    qr_data = json.dumps({
        "id": book["id"],
        "title": book["title"],
        "category": book["category"],
        "is_issued": book["is_issued"],
        "issued_to": book["issued_to"],
        "issued_date": book["issued_date"]
    })
    
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
def direct_issue(book_id: int, req: DirectIssueCreate):
    book = next((b for b in books_db if b["id"] == book_id), None)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book["is_issued"]:
        raise HTTPException(status_code=400, detail="Book is already issued")
        
    user = users_db.get(req.username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    from datetime import datetime, timedelta
    book["is_issued"] = True
    book["issued_to"] = req.username
    book["issued_date"] = datetime.now().isoformat()
    return_time = datetime.now() + timedelta(weeks=req.duration_weeks)
    book["expected_return_date"] = return_time.isoformat()
    
    return book

