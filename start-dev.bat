@echo off
echo Starting Cryptians Local Development Environment...
echo.

:: 1. Start Redis
echo Starting Redis...
start "Redis Server" cmd /k "wsl -d Ubuntu redis-server || echo Redis failed to start via WSL."

:: 2. Start Server
echo Starting Backend Server...
start "Cryptians Server" cmd /k "cd server && npm install && npm run dev"

:: 3. Start Client
echo Starting Client App...
start "Cryptians Client" cmd /k "cd client && npm install && npm run dev"

:: 4. Start Admin
echo Starting Admin Dashboard...
start "Cryptians Admin" cmd /k "cd admin && npm install && npm run dev"

echo.
echo All services are launching in separate windows.
echo If any window closes immediately, checks its error message.
