@echo off
REM ========================================
REM VS Code Extension Launcher - Skynet Edition
REM Windows Launcher Script
REM ========================================

echo.
echo ========================================
echo VS Code Extension Launcher - Skynet
echo ========================================
echo.

REM Change to the script directory
cd /d %~dp0

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Dependencies not found. Installing...
    echo.
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Dependencies installed successfully
    echo.
)

REM Launch the application
echo [INFO] Starting VS Code Extension Launcher...
echo.
call npm start

REM Pause if there was an error
if errorlevel 1 (
    echo.
    echo [ERROR] Application exited with an error
    pause
)
