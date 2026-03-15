# Dummy database for initial implementation
from datetime import datetime, timedelta
import random

# ============ USERS ============
users_db = {
    "admin": {"username": "admin", "password": "password", "role": "admin"},
    "alice": {"username": "alice", "password": "password", "role": "user"},
    "bob": {"username": "bob", "password": "password", "role": "user"},
    "charlie": {"username": "charlie", "password": "password", "role": "user"},
    "diana": {"username": "diana", "password": "password", "role": "user"},
    "ethan": {"username": "ethan", "password": "password", "role": "user"},
    "fiona": {"username": "fiona", "password": "password", "role": "user"},
    "george": {"username": "george", "password": "password", "role": "user"},
    "hannah": {"username": "hannah", "password": "password", "role": "user"},
    "ivan": {"username": "ivan", "password": "password", "role": "user"},
    "julia": {"username": "julia", "password": "password", "role": "user"},
    "kevin": {"username": "kevin", "password": "password", "role": "user"},
}

# ============ BOOKS (55 books) ============
_book_data = [
    ("Clean Code", "Robert C. Martin", "Software Engineering"),
    ("The Clean Coder", "Robert C. Martin", "Software Engineering"),
    ("Clean Architecture", "Robert C. Martin", "Software Engineering"),
    ("Design Patterns", "Gang of Four", "Software Engineering"),
    ("Refactoring", "Martin Fowler", "Software Engineering"),
    ("The Pragmatic Programmer", "David Thomas & Andrew Hunt", "Software Engineering"),
    ("Code Complete", "Steve McConnell", "Software Engineering"),
    ("Designing Data-Intensive Applications", "Martin Kleppmann", "System Design"),
    ("System Design Interview Vol.1", "Alex Xu", "System Design"),
    ("System Design Interview Vol.2", "Alex Xu", "System Design"),
    ("Building Microservices", "Sam Newman", "System Design"),
    ("Fundamentals of Software Architecture", "Mark Richards", "System Design"),
    ("Software Architecture: The Hard Parts", "Neal Ford", "System Design"),
    ("Angular for Enterprise-Ready Web Apps", "Doguhan Uluca", "Web Development"),
    ("Learning Angular", "Aristeidis Bampakos", "Web Development"),
    ("Pro Angular", "Adam Freeman", "Web Development"),
    ("Full-Stack React, TypeScript, and Node", "David Choi", "Web Development"),
    ("Eloquent JavaScript", "Marijn Haverbeke", "Web Development"),
    ("JavaScript: The Good Parts", "Douglas Crockford", "Web Development"),
    ("You Don't Know JS: Scope & Closures", "Kyle Simpson", "Web Development"),
    ("CSS in Depth", "Keith J. Grant", "Web Development"),
    ("Introduction to Algorithms", "Thomas H. Cormen", "Algorithms"),
    ("The Algorithm Design Manual", "Steven Skiena", "Algorithms"),
    ("Grokking Algorithms", "Aditya Bhargava", "Algorithms"),
    ("Competitive Programming 3", "Steven Halim", "Algorithms"),
    ("Cracking the Coding Interview", "Gayle Laakmann McDowell", "Algorithms"),
    ("Programming Pearls", "Jon Bentley", "Algorithms"),
    ("Artificial Intelligence: A Modern Approach", "Stuart Russell", "AI & ML"),
    ("Deep Learning", "Ian Goodfellow", "AI & ML"),
    ("Hands-On Machine Learning", "Aurélien Géron", "AI & ML"),
    ("Pattern Recognition and Machine Learning", "Christopher Bishop", "AI & ML"),
    ("The Hundred-Page Machine Learning Book", "Andriy Burkov", "AI & ML"),
    ("Python for Data Analysis", "Wes McKinney", "Data Science"),
    ("Data Science from Scratch", "Joel Grus", "Data Science"),
    ("Storytelling with Data", "Cole Nussbaumer Knaflic", "Data Science"),
    ("The Art of Statistics", "David Spiegelhalter", "Data Science"),
    ("Database Internals", "Alex Petrov", "Databases"),
    ("Designing Data Models", "Steve Hoberman", "Databases"),
    ("SQL Performance Explained", "Markus Winand", "Databases"),
    ("MongoDB: The Definitive Guide", "Shannon Bradshaw", "Databases"),
    ("The Linux Command Line", "William Shotts", "DevOps"),
    ("Docker Deep Dive", "Nigel Poulton", "DevOps"),
    ("Kubernetes Up & Running", "Brendan Burns", "DevOps"),
    ("Terraform: Up & Running", "Yevgeniy Brikman", "DevOps"),
    ("The Phoenix Project", "Gene Kim", "DevOps"),
    ("Networking All-in-One For Dummies", "Doug Lowe", "Networking"),
    ("Computer Networking: A Top-Down Approach", "James Kurose", "Networking"),
    ("TCP/IP Illustrated", "W. Richard Stevens", "Networking"),
    ("Operating System Concepts", "Abraham Silberschatz", "Operating Systems"),
    ("Modern Operating Systems", "Andrew Tanenbaum", "Operating Systems"),
    ("The Mythical Man-Month", "Frederick Brooks", "Project Management"),
    ("Agile Estimating and Planning", "Mike Cohn", "Project Management"),
    ("Scrum: The Art of Doing Twice the Work", "Jeff Sutherland", "Project Management"),
    ("Don't Make Me Think", "Steve Krug", "UX Design"),
    ("The Design of Everyday Things", "Don Norman", "UX Design"),
]

_users_list = [k for k, v in users_db.items() if v["role"] == "user"]

books_db = []
for i, (title, author, category) in enumerate(_book_data, start=1):
    # Randomly issue ~20% of books
    is_issued = random.Random(i).random() < 0.2
    issued_to = random.Random(i).choice(_users_list) if is_issued else None
    issued_date = (datetime.now() - timedelta(days=random.Random(i).randint(1, 30))).isoformat() if is_issued else None
    return_date = (datetime.now() + timedelta(weeks=random.Random(i).randint(1, 4))).isoformat() if is_issued else None

    books_db.append({
        "id": i,
        "title": title,
        "author": author,
        "category": category,
        "is_issued": is_issued,
        "issued_to": issued_to,
        "issued_date": issued_date,
        "expected_return_date": return_date,
    })

# ============ REQUESTS ============
requests_db = [
    {
        "id": 1,
        "book_id": 1,
        "book_title": "Clean Code",
        "username": "alice",
        "status": "pending",
        "request_date": "2026-03-15T09:00:00",
        "duration_weeks": 2,
        "expected_return_date": None,
    },
    {
        "id": 2,
        "book_id": 22,
        "book_title": "Introduction to Algorithms",
        "username": "bob",
        "status": "pending",
        "request_date": "2026-03-14T14:30:00",
        "duration_weeks": 3,
        "expected_return_date": None,
    },
    {
        "id": 3,
        "book_id": 28,
        "book_title": "Artificial Intelligence: A Modern Approach",
        "username": "diana",
        "status": "pending",
        "request_date": "2026-03-13T11:00:00",
        "duration_weeks": 1,
        "expected_return_date": None,
    },
]
