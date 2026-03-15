from fastapi import APIRouter, HTTPException
from typing import List
from schemas import IssueRequestCreate, IssueRequestResponse, RequestAction
from database import requests_db, books_db, users_db
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[IssueRequestResponse])
def get_requests():
    return requests_db

@router.post("/", response_model=IssueRequestResponse)
def create_request(req: IssueRequestCreate, username: str = "user1"):
    # In a real app, username would come from the JWT token
    
    # Check if book exists
    book = next((b for b in books_db if b["id"] == req.book_id), None)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    if book["is_issued"]:
        raise HTTPException(status_code=400, detail="Book is already issued")
        
    new_id = max((r["id"] for r in requests_db), default=0) + 1
    
    new_request = {
        "id": new_id,
        "book_id": req.book_id,
        "username": username,
        "status": "pending",
        "request_date": datetime.now().isoformat(),
        "duration_weeks": req.duration_weeks,
        "expected_return_date": None
    }
    
    requests_db.append(new_request)
    return new_request

@router.put("/{request_id}")
def update_request_status(request_id: int, action: RequestAction):
    req = next((r for r in requests_db if r["id"] == request_id), None)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
        
    if req["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request is already processed")
        
    book = next((b for b in books_db if b["id"] == req["book_id"]), None)
    
    if action.action == "approve":
        req["status"] = "approved"
        if book:
            book["is_issued"] = True
            book["issued_to"] = req["username"]
            book["issued_date"] = datetime.now().isoformat()
            from datetime import timedelta
            return_time = datetime.now() + timedelta(weeks=req.get("duration_weeks", 2))
            book["expected_return_date"] = return_time.isoformat()
            req["expected_return_date"] = return_time.isoformat()
    elif action.action == "reject":
        req["status"] = "rejected"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    return {"message": f"Request {action.action}d successfully", "request": req}
