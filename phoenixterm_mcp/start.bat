@echo off
REM ##############################################################################
REM 🔥 PhoenixTerm MCP - Start Script (Windows)
REM Advanced PTY Terminal Server for AI Autonomy
REM ##############################################################################

setlocal enabledelayedexpansion

REM Banner
echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║  🔥 PhoenixTerm MCP Server v2.0.0                ║
echo ║  Advanced PTY Terminal for AI Autonomy          ║
echo ╚═══════════════════════════════════════════════════╝
echo.

REM Vérifier Node.js
echo [PhoenixTerm] Checking Node.js installation...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo [INFO] Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

REM Vérifier la version de Node.js
for /f "tokens=1 delims=v" %%v in ('node -v') do set NODE_VERSION=%%v
echo [OK] Node.js %NODE_VERSION% detected

REM Vérifier npm
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('npm -v') do set NPM_VERSION=%%v
echo [OK] npm %NPM_VERSION% detected

REM Installer les dépendances si nécessaire
if not exist "node_modules\" (
    echo [PhoenixTerm] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)

REM Créer les répertoires de données
if not exist "data\sessions\" mkdir data\sessions
if not exist "data\templates\" mkdir data\templates
if not exist "data\logs\" mkdir data\logs

echo [OK] Data directories ready

REM Mode de démarrage
set MODE=%1
if "%MODE%"=="" set MODE=stdio

if /i "%MODE%"=="websocket" goto :websocket
if /i "%MODE%"=="ws" goto :websocket
if /i "%MODE%"=="stdio" goto :stdio

echo [ERROR] Unknown mode: %MODE%
echo [INFO] Usage: start.bat [stdio^|websocket]
pause
exit /b 1

:websocket
echo [PhoenixTerm] Starting in WebSocket mode...
set PHOENIXTERM_MODE=websocket
node server.js
goto :end

:stdio
echo [PhoenixTerm] Starting in stdio mode...
set PHOENIXTERM_MODE=stdio
node server.js
goto :end

:end
endlocal
