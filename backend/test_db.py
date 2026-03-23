from database import users_db
username = "admin"
password = "password"
user = users_db.get(username)
if not user or user["password"] != password:
    print("FAILED")
else:
    print("SUCCESS")
    print(f"User: {user}")
