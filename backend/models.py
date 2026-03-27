from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database_sql import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False)
    
    # Relationship with books (ones they have borrowed) and requests
    borrowed_books = relationship("Book", back_populates="borrower")
    requests = relationship("Request", back_populates="user")


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True, nullable=False)
    author = Column(String(255), index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False)
    quantity = Column(Integer, default=1)
    is_issued = Column(Boolean, default=False)
    
    # Foreign key correlating to User.username
    issued_to = Column(String(50), ForeignKey("users.username"), nullable=True)
    issued_date = Column(DateTime, nullable=True)
    expected_return_date = Column(DateTime, nullable=True)

    # Relationships
    borrower = relationship("User", back_populates="borrowed_books")
    requests = relationship("Request", back_populates="book")


class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"))
    username = Column(String(50), ForeignKey("users.username"))
    
    status = Column(String(20), default="pending")  # e.g., pending, approved, rejected
    request_date = Column(DateTime, default=datetime.utcnow)
    duration_weeks = Column(Integer, nullable=False)
    expected_return_date = Column(DateTime, nullable=True)

    # Relationships
    book = relationship("Book", back_populates="requests")
    user = relationship("User", back_populates="requests")
