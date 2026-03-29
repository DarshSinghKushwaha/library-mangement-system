from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, books, requests, notifications

app = FastAPI(title="Library Management System API")

# Setup CORS, allowing the Angular frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(books.router, prefix="/api/books", tags=["books"])
app.include_router(requests.router, prefix="/api/requests", tags=["requests"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])

from sqlalchemy.orm import Session
from database_sql import get_db, engine
import models
from seed_db import seed_database

# Make sure tables are created and maybe seed data on startup
models.Base.metadata.create_all(bind=engine)
seed_database()

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/users")
def get_users(db: Session = Depends(get_db)):
    # return only usernames where role is user
    users = db.query(models.User).filter(models.User.role == "user").all()
    return [u.username for u in users]

@app.get("/")
def root():
    return {"message": "Welcome to Library Management System API"}
