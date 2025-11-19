@echo off
echo ╔═══════════════════════════════════════════════╗
echo ║  EchoTerm MCP - Starting...                   ║
echo ╚═══════════════════════════════════════════════╝
echo.

REM Check if config exists
if not exist "app\backend_node\config.json" (
    echo [!] Config file not found. Creating from example...
    copy "app\backend_node\config.json.example" "app\backend_node\config.json"
    echo [!] Please edit app\backend_node\config.json and add your API key.
    pause
    exit /b 1
)

REM Check if node_modules exists in backend
if not exist "app\backend_node\node_modules" (
    echo [*] Installing backend dependencies...
    cd app\backend_node
    call npm install
    cd ..\..
)

REM Check if node_modules exists in electron
if not exist "app\electron\node_modules" (
    echo [*] Installing Electron dependencies...
    cd app\electron
    call npm install
    cd ..\..
)

echo [*] Starting backend server...
start "EchoTerm Backend" cmd /k "cd app\backend_node && npm start"

timeout /t 3 /nobreak >nul

echo [*] Starting Electron UI...
cd app\electron
call npm start

echo.
echo [*] EchoTerm stopped.
pause
