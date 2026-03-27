from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from database_sql import get_db
import models
from schemas import IssueRequestCreate, IssueRequestResponse, RequestAction

router = APIRouter()

@router.get("/", response_model=List[IssueRequestResponse])
def get_requests(db: Session = Depends(get_db)):
    requests = db.query(models.Request).all()
    # Enrich manual responses if needed, though SQLAlchemy relationship handles a lot.
    # The current schema expects some extra fields like book_title.
    enriched = []
    for req in requests:
        book_title = req.book.title if req.book else None
        
        # Pydantic will serialize datetime to ISO string automatically
        # Or we can manually map it if strictly needed, but Pydantic handles ORM conversion.
        enriched.append({
            "id": req.id,
            "book_id": req.book_id,
            "book_title": book_title,
            "username": req.username,
            "status": req.status,
            "request_date": req.request_date.isoformat() if req.request_date else None,
            "duration_weeks": req.duration_weeks,
            "expected_return_date": req.expected_return_date.isoformat() if req.expected_return_date else None
        })
    return enriched

@router.post("/", response_model=IssueRequestResponse)
def create_request(req: IssueRequestCreate, db: Session = Depends(get_db)):
    username = req.username or "Unknown User"
    
    # Check if book exists
    book = db.query(models.Book).filter(models.Book.id == req.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    if book.is_issued:
        raise HTTPException(status_code=400, detail="Book is already issued")
        
    new_request = models.Request(
        book_id=req.book_id,
        username=username,
        status="pending",
        request_date=datetime.now(),
        duration_weeks=req.duration_weeks,
        expected_return_date=None
    )
    
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    
    return {
        "id": new_request.id,
        "book_id": new_request.book_id,
        "book_title": book.title,
        "username": new_request.username,
        "status": new_request.status,
        "request_date": new_request.request_date.isoformat() if new_request.request_date else None,
        "duration_weeks": new_request.duration_weeks,
        "expected_return_date": None
    }

@router.put("/{request_id}")
def update_request_status(request_id: int, action: RequestAction, db: Session = Depends(get_db)):
    req = db.query(models.Request).filter(models.Request.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Request is already processed")
        
    book = req.book
    
    if action.action == "approve":
        req.status = "approved"
        if book:
            book.is_issued = True
            book.issued_to = req.username
            book.issued_date = datetime.now()
            
            return_time = datetime.now() + timedelta(weeks=req.duration_weeks)
            book.expected_return_date = return_time
            req.expected_return_date = return_time
            
    elif action.action == "reject":
        req.status = "rejected"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    db.commit()
    db.refresh(req)
    
    return {
        "message": f"Request {action.action}d successfully", 
        "request": {
            "id": req.id,
            "status": req.status,
            "expected_return_date": req.expected_return_date.isoformat() if req.expected_return_date else None
        }
    }
