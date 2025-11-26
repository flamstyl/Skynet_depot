@echo off
echo ========================================
echo   QuickLauncher MCP - Startup Script
echo ========================================
echo.

REM Check if Python is installed
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo [1/3] Starting Python Backend Server...
start "QuickLauncher Backend" cmd /k "cd backend\python_server && python server.py"
timeout /t 2 /nobreak >nul

echo [2/3] Starting MCP Server...
start "QuickLauncher MCP" cmd /k "cd backend\mcp && npm start"
timeout /t 2 /nobreak >nul

echo [3/3] Starting Electron Launcher...
start "QuickLauncher UI" cmd /k "cd launcher\electron_app && npm start"

echo.
echo ========================================
echo   QuickLauncher MCP is starting...
echo   Press Alt+Space to open the launcher
echo ========================================
echo.
echo Close this window to stop showing startup messages.
echo Individual components will continue running.
pause
