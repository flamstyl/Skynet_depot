@echo off
echo ========================================
echo   QuickLauncher MCP - Stop Script
echo ========================================
echo.

echo Stopping QuickLauncher processes...

REM Kill Python backend
taskkill /FI "WINDOWTITLE eq QuickLauncher Backend*" /F >nul 2>&1

REM Kill MCP server
taskkill /FI "WINDOWTITLE eq QuickLauncher MCP*" /F >nul 2>&1

REM Kill Electron app
taskkill /FI "WINDOWTITLE eq QuickLauncher UI*" /F >nul 2>&1
taskkill /IM electron.exe /F >nul 2>&1

echo.
echo QuickLauncher MCP stopped.
echo.
pause
