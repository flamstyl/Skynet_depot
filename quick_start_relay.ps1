# Quick Fix Script - Relay MCP Only
# Goal: Get 1 working MCP server in 2 minutes max

$ErrorActionPreference = "Stop"
Write-Host "`n=== RELAY MCP QUICK START ===" -ForegroundColor Cyan

# Step 1: Install dependencies
Write-Host "[1/3] Installing Python dependencies..." -NoNewline
cd C:\Users\rapha\IA\Skynet_depot\relay_mcp
pip install --quiet fastapi uvicorn pydantic flask pyyaml requests 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host " ✅" -ForegroundColor Green
} else {
    Write-Host " ❌" -ForegroundColor Red
    exit 1
}

# Step 2: Check if port 8001 is free
Write-Host "[2/3] Checking port 8001..." -NoNewline
$portUsed = netstat -ano | Select-String ":8001" | Select-String "LISTENING"
if ($portUsed) {
    Write-Host " ⚠️  In use, killing..." -ForegroundColor Yellow
    $pid = ($portUsed -split '\s+')[-1]
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}
Write-Host " ✅" -ForegroundColor Green

# Step 3: Start Relay in background
Write-Host "[3/3] Starting Relay MCP..." -NoNewline
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\rapha\IA\Skynet_depot\relay_mcp; python -m uvicorn api.fastapi_app:app --port 8001" -WindowStyle Minimized

# Wait and test
Start-Sleep -Seconds 5
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8001" -Method GET -TimeoutSec 3
    Write-Host " ✅ RUNNING" -ForegroundColor Green
    Write-Host "`n🎉 Relay MCP is UP on http://localhost:8001" -ForegroundColor Green
    Write-Host "Docs: http://localhost:8001/docs`n" -ForegroundColor Cyan
} catch {
    Write-Host " ❌ FAILED" -ForegroundColor Red
    Write-Host "Check logs in the minimized window`n" -ForegroundColor Yellow
}
