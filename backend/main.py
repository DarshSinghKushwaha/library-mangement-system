from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, books, requests

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

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/users")
def get_users():
    from database import users_db
    # return only usernames where role is user
    users_list = [v["username"] for k, v in users_db.items() if v["role"] == "user"]
    return users_list

@app.get("/")
def root():
    return {"message": "Welcome to Library Management System API"}
