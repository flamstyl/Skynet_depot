# Quick Diagnostic Script - Skynet Depot
# Timeout: 60 seconds max

$ErrorActionPreference = "SilentlyContinue"
$results = @()

Write-Host "`n=== SKYNET DEPOT QUICK DIAGNOSTIC ===" -ForegroundColor Cyan
Write-Host "Started: $(Get-Date -Format 'HH:mm:ss')`n" -ForegroundColor Gray

# Test 1: DevBox API
Write-Host "[1/5] Testing DevBox API..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000" -Method GET -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅ RUNNING" -ForegroundColor Green
        $results += "DevBox: ✅ RUNNING (port 4000)"
    }
} catch {
    Write-Host " ❌ DOWN" -ForegroundColor Red
    $results += "DevBox: ❌ DOWN"
}

# Test 2: ClipboardPro MCP
Write-Host "[2/5] Testing ClipboardPro MCP..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002" -Method GET -TimeoutSec 3
    Write-Host " ✅ RUNNING" -ForegroundColor Green
    $results += "ClipboardPro: ✅ RUNNING (port 3002)"
} catch {
    Write-Host " ❌ DOWN" -ForegroundColor Red
    $results += "ClipboardPro: ❌ DOWN"
}

# Test 3: Relay MCP
Write-Host "[3/5] Testing Relay MCP..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8001" -Method GET -TimeoutSec 3
    Write-Host " ✅ RUNNING" -ForegroundColor Green
    $results += "Relay: ✅ RUNNING (port 8001)"
} catch {
    Write-Host " ❌ DOWN" -ForegroundColor Red
    $results += "Relay: ❌ DOWN"
}

# Test 4: Docker
Write-Host "[4/5] Checking Docker..." -NoNewline
$dockerRunning = docker ps 2>&1 | Select-String -Pattern "CONTAINER" -Quiet
if ($dockerRunning) {
    Write-Host " ✅ RUNNING" -ForegroundColor Green
    $results += "Docker: ✅ RUNNING"
} else {
    Write-Host " ❌ DOWN" -ForegroundColor Red
    $results += "Docker: ❌ DOWN"
}

# Test 5: Check dependencies
Write-Host "[5/5] Checking dependencies..." -NoNewline
$nodeOk = node --version 2>&1 | Select-String -Pattern "v\d+"
$pythonOk = python --version 2>&1 | Select-String -Pattern "Python"
if ($nodeOk -and $pythonOk) {
    Write-Host " ✅ OK" -ForegroundColor Green
    $results += "Dependencies: ✅ Node + Python OK"
} else {
    Write-Host " ⚠️  PARTIAL" -ForegroundColor Yellow
    $results += "Dependencies: ⚠️  Issues detected"
}

# Summary
Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
foreach ($result in $results) {
    Write-Host $result
}

Write-Host "`nCompleted: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
Write-Host "=================================`n" -ForegroundColor Cyan
