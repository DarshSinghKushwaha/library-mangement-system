@echo off
echo Starting Library Management System...

echo Starting backend...
start "Library Management Backend" cmd /k "cd backend && call venv\Scripts\activate && "d:\New_folder\oges asset mgmt\library mangement system\backend\venv\Scripts\python.exe" -m uvicorn main:app --port 8000 --host 192.168.1.10 || echo Failed to start backend"

echo Starting frontend...
start "Library Management Frontend" cmd /k "cd frontend && nvm use 24 && npm start || echo Failed to start frontend"

echo Both frontend and backend are starting in new windows.
