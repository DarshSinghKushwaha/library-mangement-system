import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

print("Starting tests...")

try:
    # Test health
    with urllib.request.urlopen(f"{BASE_URL}/api/health") as response:
        print("Health:", json.loads(response.read().decode()))

    # Test users
    with urllib.request.urlopen(f"{BASE_URL}/api/users") as response:
        print("Users:", json.loads(response.read().decode()))

    # Test books
    with urllib.request.urlopen(f"{BASE_URL}/api/books") as response:
        print("Books count:", len(json.loads(response.read().decode())))

    # Test paginated books
    with urllib.request.urlopen(f"{BASE_URL}/api/books/paginated") as response:
        print("Paginated Books total:", json.loads(response.read().decode()).get('total'))

    # Test requests
    with urllib.request.urlopen(f"{BASE_URL}/api/requests") as response:
        print("Requests count:", len(json.loads(response.read().decode())))
    
    print("Tests completed successfully.")

except Exception as e:
    print(f"Error connecting to server: {e}")
