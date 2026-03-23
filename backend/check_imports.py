try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    import jwt
    from database import users_db
    from routers import auth, books, requests
    print("IMPORT_SUCCESS")
except Exception as e:
    print(f"IMPORT_ERROR: {e}")
