# Dummy database for initial implementation
from datetime import datetime

users_db = {
    "admin": {
        "username": "admin",
        "password": "password",
        "role": "admin"
    },
    "user1": {
        "username": "user1",
        "password": "password",
        "role": "user"
    }
}

books_db = [
    {
        "id": 1,
        "title": "The Clean Coder",
        "author": "Robert C. Martin",
        "category": "Software Engineering",
        "is_issued": False,
        "issued_to": None,
        "issued_date": None,
        "expected_return_date": None
    },
    {
        "id": 2,
        "title": "Designing Data-Intensive Applications",
        "author": "Martin Kleppmann",
        "category": "System Design",
        "is_issued": True,
        "issued_to": "user1",
        "issued_date": "2026-03-01T10:00:00",
        "expected_return_date": "2026-03-15T10:00:00"
    },
    {
        "id": 3,
        "title": "Angular for Enterprise-Ready Web Applications",
        "author": "Doguhan Uluca",
        "category": "Web Development",
        "is_issued": False,
        "issued_to": None,
        "issued_date": None,
        "expected_return_date": None
    }
]

# Pending requests to issue a book
# Status: "pending", "approved", "rejected"
requests_db = [
    {
        "id": 1,
        "book_id": 1,
        "username": "user1",
        "status": "pending",
        "request_date": "2026-03-15T09:00:00",
        "duration_weeks": 2,
        "expected_return_date": None
    }
]
