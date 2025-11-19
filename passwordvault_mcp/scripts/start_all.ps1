# PasswordVault MCP — Start All Services (PowerShell)
# Skynet Secure Vault v1.0

Write-Host "🔐 Starting PasswordVault MCP..." -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Check dependencies
Write-Host "📋 Checking dependencies..." -ForegroundColor Yellow
Write-Host ""

# Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
    $PythonAvailable = $true
} catch {
    Write-Host "❌ Python not found. Please install Python 3.11+" -ForegroundColor Red
    exit 1
}

# Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
    $NodeAvailable = $true
} catch {
    Write-Host "⚠️  Node.js not found. MCP server will not start." -ForegroundColor Yellow
    $NodeAvailable = $false
}

# Check Python dependencies
$BackendPath = Join-Path $ProjectRoot "app\backend_python"
$VenvPath = Join-Path $BackendPath "venv"

if (-not (Test-Path $VenvPath)) {
    Write-Host ""
    Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
    Set-Location $BackendPath
    python -m venv venv
    & "$VenvPath\Scripts\Activate.ps1"
    pip install -r requirements.txt
    deactivate
    Write-Host "✓ Python dependencies installed" -ForegroundColor Green
}

# Check Node.js dependencies
$MCPPath = Join-Path $ProjectRoot "app\mcp"
$NodeModulesPath = Join-Path $MCPPath "node_modules"

if ($NodeAvailable -and -not (Test-Path $NodeModulesPath)) {
    Write-Host ""
    Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
    Set-Location $MCPPath
    npm install
    Write-Host "✓ Node.js dependencies installed" -ForegroundColor Green
}

# Start services
Write-Host ""
Write-Host "🚀 Starting services..." -ForegroundColor Yellow
Write-Host ""

# Start Python backend
Write-Host "1️⃣  Starting Python backend..." -ForegroundColor Cyan
Set-Location $BackendPath

$PythonJob = Start-Job -ScriptBlock {
    param($BackendPath, $VenvPath)
    Set-Location $BackendPath
    & "$VenvPath\Scripts\Activate.ps1"
    python vault_server.py
} -ArgumentList $BackendPath, $VenvPath

Write-Host "✓ Python backend started (Job ID: $($PythonJob.Id))" -ForegroundColor Green

# Wait for backend to start
Start-Sleep -Seconds 3

# Start MCP server
if ($NodeAvailable) {
    Write-Host ""
    Write-Host "2️⃣  Starting MCP server..." -ForegroundColor Cyan
    Set-Location $MCPPath

    $MCPJob = Start-Job -ScriptBlock {
        param($MCPPath)
        Set-Location $MCPPath
        node server.js
    } -ArgumentList $MCPPath

    Write-Host "✓ MCP server started (Job ID: $($MCPJob.Id))" -ForegroundColor Green
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Python Backend: http://127.0.0.1:5555" -ForegroundColor White
if ($NodeAvailable) {
    Write-Host "MCP Server:     http://127.0.0.1:3000" -ForegroundColor White
}
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Cyan
Write-Host "  Python: Receive-Job -Id $($PythonJob.Id) -Keep" -ForegroundColor Gray
if ($NodeAvailable) {
    Write-Host "  MCP:    Receive-Job -Id $($MCPJob.Id) -Keep" -ForegroundColor Gray
}
Write-Host ""

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 1

        # Check if jobs are still running
        if ($PythonJob.State -ne "Running") {
            Write-Host "⚠️  Python backend stopped" -ForegroundColor Yellow
            break
        }

        if ($NodeAvailable -and $MCPJob.State -ne "Running") {
            Write-Host "⚠️  MCP server stopped" -ForegroundColor Yellow
            break
        }
    }
} finally {
    Write-Host ""
    Write-Host "🛑 Stopping services..." -ForegroundColor Yellow

    Stop-Job -Id $PythonJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $PythonJob.Id -ErrorAction SilentlyContinue

    if ($NodeAvailable) {
        Stop-Job -Id $MCPJob.Id -ErrorAction SilentlyContinue
        Remove-Job -Id $MCPJob.Id -ErrorAction SilentlyContinue
    }

    Write-Host "✓ Services stopped" -ForegroundColor Green
}
