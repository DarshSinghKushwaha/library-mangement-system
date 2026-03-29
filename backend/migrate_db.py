import sqlite3

try:
    conn = sqlite3.connect('c:/Users/darsh/Desktop/angular/library mangement system/backend/library_management.db')
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE users ADD COLUMN email VARCHAR(100);")
    conn.commit()
    print("Successfully added email column to users table.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("Column already exists. Skipping.")
    else:
        print(f"OperationalError: {e}")
finally:
    if conn:
        conn.close()
