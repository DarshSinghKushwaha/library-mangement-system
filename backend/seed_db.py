from database_sql import SessionLocal, engine
import models
from datetime import datetime, timedelta
import random
from security import get_password_hash

# ============ RAW DUMMY DATA ============
_users_db = {
    "admin": {"username": "admin", "password": "password", "role": "admin"},
    "ankur": {"username": "ankur", "password": "password", "role": "user"},
    "aman": {"username": "aman", "password": "password", "role": "user"},
    "vikas": {"username": "vikas", "password": "password", "role": "user"},
    "satyam": {"username": "satyam", "password": "password", "role": "user"},
    "sagar": {"username": "sagar", "password": "password", "role": "user"}
}

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
    ("The Design of Everyday Things", "Don Norman", "UX Design")
]

_users_list = [k for k, v in _users_db.items() if v["role"] == "user"]

def generate_books():
    books = []
    for i, (title, author, category) in enumerate(_book_data, start=1):
        # Randomly issue ~20% of books
        is_issued = random.Random(i).random() < 0.2
        issued_to = random.Random(i).choice(_users_list) if is_issued else None
        issued_date = (datetime.now() - timedelta(days=random.Random(i).randint(1, 30))) if is_issued else None
        return_date = (datetime.now() + timedelta(weeks=random.Random(i).randint(1, 4))) if is_issued else None

        books.append({
            "title": title,
            "author": author,
            "category": category,
            "quantity": 1,
            "is_issued": is_issued,
            "issued_to": issued_to,
            "issued_date": issued_date,
            "expected_return_date": return_date,
        })
    return books

def seed_database():
    # Create tables
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if database is already populated
        existing_user = db.query(models.User).first()
        if existing_user:
            print("Database already seeded.")
            return

        print("Seeding database from dummy data...")
        
        # 1. Seed Users (with hashed passwords)
        for username, user_data in _users_db.items():
            user = models.User(
                username=user_data["username"],
                password=get_password_hash(user_data["password"]),
                role=user_data["role"]
            )
            db.add(user)
        db.commit()
        print(f"Seeded {len(_users_db)} users (with hashed passwords).")

        # 2. Seed Books and create implicit requests for issued ones
        books_to_insert = generate_books()
        for book_data in books_to_insert:
            new_book = models.Book(
                title=book_data["title"],
                author=book_data["author"],
                category=book_data["category"],
                quantity=book_data["quantity"],
                is_issued=book_data["is_issued"],
                issued_to=book_data["issued_to"],
                issued_date=book_data["issued_date"],
                expected_return_date=book_data["expected_return_date"]
            )
            db.add(new_book)
            db.flush() # Get the new_book.id
            
            # If the book is already issued, create a matching 'approved' request entry
            if book_data["is_issued"] and book_data["issued_to"]:
                new_req_entry = models.Request(
                    book_id=new_book.id,
                    username=book_data["issued_to"],
                    status="approved",
                    request_date=book_data["issued_date"] or datetime.now(),
                    duration_weeks=2, # Default
                    expected_return_date=book_data["expected_return_date"]
                )
                db.add(new_req_entry)

        db.commit()
        print(f"Seeded {len(books_to_insert)} books and created matching request history.")

        # 3. Add some pending mock requests
        mock_reqs = [
            {"book_id": 1, "username": "ankur", "req_date": datetime.now() - timedelta(days=2)},
            {"book_id": 22, "username": "aman", "req_date": datetime.now() - timedelta(days=1)},
            {"book_id": 28, "username": "vikas", "req_date": datetime.now() - timedelta(days=3)},
        ]
        
        for mr in mock_reqs:
            req = models.Request(
                book_id=mr["book_id"],
                username=mr["username"],
                status="pending",
                request_date=mr["req_date"],
                duration_weeks=2,
                expected_return_date=None
            )
            db.add(req)
            
        db.commit()
        print(f"Seeded {len(mock_reqs)} pending requests.")
        print("Database seeding completed successfully.")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
