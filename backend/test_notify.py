from database_sql import SessionLocal
from routers.notifications import trigger_overdue_notifications

def test_notify():
    db = SessionLocal()
    try:
        result = trigger_overdue_notifications(db)
        print("Result:", result)
    finally:
        db.close()

if __name__ == "__main__":
    test_notify()
