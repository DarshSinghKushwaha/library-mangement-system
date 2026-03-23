from fastapi import APIRouter, HTTPException, Depends
from schemas import LoginRequest, Token
from database import users_db
import jwt
from datetime import datetime, timedelta

router = APIRouter()

SECRET_KEY = "dummy_secret_key_for_now"
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login", response_model=Token)
def login(request: LoginRequest):
    print(f"Login attempt for: {request.username}")
    user = users_db.get(request.username)
    if not user:
        print(f"User {request.username} not found")
        raise HTTPException(status_code=401, detail="User not found")
    if user["password"] != request.password:
        print(f"Invalid password for {request.username}: expected {user['password']}, got {request.password}")
        raise HTTPException(status_code=401, detail="Invalid password")
    
    access_token = create_access_token(data={"sub": user["username"], "role": user["role"]}, expires_delta=timedelta(hours=24))
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}
