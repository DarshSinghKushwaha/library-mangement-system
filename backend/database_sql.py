from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Replace the URL below with your actual database connection string
# Examples: 
# PostgreSQL: "postgresql://user:password@localhost/lms_db"
# MySQL: "mysql+pymysql://user:password@localhost/lms_db"
# SQLite (for local testing): "sqlite:///./sql_app.db"
SQLALCHEMY_DATABASE_URL = "sqlite:///./library_management.db"

# Create Database Engine
# connect_args={"check_same_thread": False} is needed only for SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Create a scoped Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for the ORM models
Base = declarative_base()

def get_db():
    """Dependency to get the database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
