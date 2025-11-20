# Windows VM - Test Environment Setup
# Installs necessary tools for testing code in Windows VM
# 
# SECURITY WARNING: This script contains hardcoded credentials for development/testing only
# DO NOT use these credentials in production environments
# Change passwords and use secure credential management in production

Write-Host "=== Setting up Windows VM for DevBox Testing ===" -ForegroundColor Blue

# Enable execution of PowerShell scripts
Set-ExecutionPolicy Bypass -Scope Process -Force

# Install Chocolatey (Windows package manager)
Write-Host "Installing Chocolatey..." -ForegroundColor Green
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Refresh environment
$env:ChocolateyInstall = Convert-Path "$((Get-Command choco).Path)\..\.."
Import-Module "$env:ChocolateyInstall\helpers\chocolateyProfile.psm1"
refreshenv

# Install Python
Write-Host "Installing Python..." -ForegroundColor Green
choco install python -y

# Install Node.js
Write-Host "Installing Node.js..." -ForegroundColor Green
choco install nodejs -y

# Install .NET SDK
Write-Host "Installing .NET SDK..." -ForegroundColor Green
choco install dotnet-sdk -y

# Install Git
Write-Host "Installing Git..." -ForegroundColor Green
choco install git -y

# Install Visual Studio Build Tools
Write-Host "Installing Visual Studio Build Tools..." -ForegroundColor Green
choco install visualstudio2022buildtools -y

# Install additional tools
Write-Host "Installing additional tools..." -ForegroundColor Green
choco install vim -y
choco install 7zip -y
choco install curl -y
choco install wget -y

# Install Rust
Write-Host "Installing Rust..." -ForegroundColor Green
choco install rust -y

# Install Go
Write-Host "Installing Go..." -ForegroundColor Green
choco install golang -y

# Install Java
Write-Host "Installing Java..." -ForegroundColor Green
choco install openjdk -y

# Refresh environment variables
refreshenv

# Create workspace directory
Write-Host "Creating workspace directory..." -ForegroundColor Green
$WorkspaceDir = "C:\workspace"
if (-not (Test-Path $WorkspaceDir)) {
    New-Item -Path $WorkspaceDir -ItemType Directory | Out-Null
}

# Grant full permissions
icacls $WorkspaceDir /grant Everyone:F /T

# Enable PowerShell Remoting
Write-Host "Enabling PowerShell Remoting..." -ForegroundColor Green
Enable-PSRemoting -Force
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "*" -Force

# Configure Windows Firewall
Write-Host "Configuring firewall..." -ForegroundColor Green
New-NetFirewallRule -DisplayName "PowerShell Remoting" -Direction Inbound -Protocol TCP -LocalPort 5985 -Action Allow

# Create test user
Write-Host "Creating test user..." -ForegroundColor Green
Write-Host "WARNING: Using hardcoded credentials for development only!" -ForegroundColor Red
Write-Host "SECURITY: Change password in production environments" -ForegroundColor Red
$Username = "devbox"
$Password = ConvertTo-SecureString "devbox" -AsPlainText -Force

try {
    New-LocalUser -Name $Username -Password $Password -FullName "DevBox User" -Description "DevBox Test User" -ErrorAction Stop
    Add-LocalGroupMember -Group "Administrators" -Member $Username -ErrorAction Stop
    Write-Host "✓ User created: $Username" -ForegroundColor Green
} catch {
    Write-Host "User may already exist" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✓ Windows VM setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Installed tools:" -ForegroundColor Cyan
Write-Host "  Python: $(python --version 2>&1)"
Write-Host "  Node.js: $(node --version 2>&1)"
Write-Host "  .NET: $(dotnet --version 2>&1)"
Write-Host "  Git: $(git --version 2>&1)"
Write-Host "  Rust: $(rustc --version 2>&1)"
Write-Host "  Go: $(go version 2>&1)"
Write-Host "  Java: $(java -version 2>&1 | Select-Object -First 1)"
Write-Host ""
Write-Host "Workspace directory: $WorkspaceDir" -ForegroundColor Cyan
Write-Host "Test user: $Username / devbox" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now use this VM for testing code remotely!" -ForegroundColor Blue
Write-Host ""
Write-Host "To test remoting:" -ForegroundColor Yellow
Write-Host '  Enter-PSSession -ComputerName localhost -Credential (Get-Credential)' -ForegroundColor Yellow
