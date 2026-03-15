from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class BookBase(BaseModel):
    title: str
    author: str
    category: str

class BookCreate(BookBase):
    pass

class BookResponse(BookBase):
    id: int
    is_issued: bool
    issued_to: Optional[str] = None
    issued_date: Optional[str] = None
    expected_return_date: Optional[str] = None

class IssueRequestCreate(BaseModel):
    book_id: int
    duration_weeks: int

class IssueRequestResponse(BaseModel):
    id: int
    book_id: int
    book_title: Optional[str] = None
    username: str
    status: str
    request_date: str
    duration_weeks: int
    expected_return_date: Optional[str] = None

class RequestAction(BaseModel):
    action: str  # "approve" or "reject"
    
class DirectIssueCreate(BaseModel):
    username: str
    duration_weeks: int

