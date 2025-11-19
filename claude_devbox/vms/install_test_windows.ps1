# Claude DevBox - Windows VM Test Script
# Automated testing on Windows VM using VirtualBox

param(
    [Parameter(Mandatory=$false)]
    [string]$Command = "help",

    [Parameter(Mandatory=$false)]
    [string]$CodeFile,

    [Parameter(Mandatory=$false)]
    [string]$Language,

    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "C:\temp\test_output.log"
)

$VM_NAME = "devbox-windows-test"
$VM_USER = "devbox"
$VM_PASS = "devbox123"

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

# Check if VirtualBox is installed
function Check-VirtualBox {
    if (-not (Get-Command VBoxManage -ErrorAction SilentlyContinue)) {
        Write-Error-Custom "VirtualBox is not installed or not in PATH"
        Write-Info "Download from: https://www.virtualbox.org/wiki/Downloads"
        exit 1
    }
    Write-Info "VirtualBox installed: $(VBoxManage --version)"
}

# Start VM
function Start-VM {
    Write-Info "Starting VM: $VM_NAME"

    $vmState = VBoxManage showvminfo $VM_NAME --machinereadable | Select-String "VMState="

    if ($vmState -match 'running') {
        Write-Info "VM is already running"
        return
    }

    VBoxManage startvm $VM_NAME --type headless

    Write-Info "Waiting for VM to boot..."
    Start-Sleep -Seconds 30

    Write-Success "VM started"
}

# Stop VM
function Stop-VM {
    Write-Info "Stopping VM: $VM_NAME"

    VBoxManage controlvm $VM_NAME poweroff

    Write-Success "VM stopped"
}

# Get VM status
function Get-VMStatus {
    $vmState = VBoxManage showvminfo $VM_NAME --machinereadable | Select-String "VMState="

    if ($vmState -match 'running') {
        Write-Info "VM Status: Running"
        return $true
    } else {
        Write-Info "VM Status: Stopped"
        return $false
    }
}

# Execute command in VM
function Invoke-VMCommand {
    param([string]$Cmd)

    Write-Info "Executing in VM: $Cmd"

    $result = VBoxManage guestcontrol $VM_NAME run `
        --exe "C:\Windows\System32\cmd.exe" `
        --username $VM_USER `
        --password $VM_PASS `
        --wait-stdout `
        -- /c $Cmd

    return $result
}

# Copy file to VM
function Copy-ToVM {
    param(
        [string]$LocalFile,
        [string]$RemotePath
    )

    Write-Info "Copying $LocalFile to VM:$RemotePath"

    VBoxManage guestcontrol $VM_NAME copyto `
        --username $VM_USER `
        --password $VM_PASS `
        $LocalFile `
        $RemotePath

    Write-Success "File copied to VM"
}

# Copy file from VM
function Copy-FromVM {
    param(
        [string]$RemotePath,
        [string]$LocalFile
    )

    Write-Info "Copying VM:$RemotePath to $LocalFile"

    VBoxManage guestcontrol $VM_NAME copyfrom `
        --username $VM_USER `
        --password $VM_PASS `
        $RemotePath `
        $LocalFile

    Write-Success "File copied from VM"
}

# Test code in VM
function Test-Code {
    param(
        [string]$CodeFile,
        [string]$Language,
        [string]$OutputFile
    )

    Write-Info "Testing $Language code in Windows VM..."

    # Ensure VM is running
    if (-not (Get-VMStatus)) {
        Start-VM
    }

    # Create test directory
    Invoke-VMCommand "mkdir C:\test" | Out-Null

    # Copy code to VM
    $vmCodePath = "C:\test\$(Split-Path $CodeFile -Leaf)"
    Copy-ToVM $CodeFile $vmCodePath

    # Execute based on language
    $exitCode = 0

    switch ($Language) {
        "python" {
            Write-Info "Running Python code..."
            $output = Invoke-VMCommand "python $vmCodePath"
        }
        "javascript" {
            Write-Info "Running Node.js code..."
            $output = Invoke-VMCommand "node $vmCodePath"
        }
        "java" {
            Write-Info "Compiling and running Java code..."
            $className = [System.IO.Path]::GetFileNameWithoutExtension($CodeFile)
            $output = Invoke-VMCommand "cd C:\test && javac $(Split-Path $CodeFile -Leaf) && java $className"
        }
        "csharp" {
            Write-Info "Compiling and running C# code..."
            $output = Invoke-VMCommand "cd C:\test && csc $(Split-Path $CodeFile -Leaf) && $(Split-Path $CodeFile -Leaf).exe"
        }
        "powershell" {
            Write-Info "Running PowerShell code..."
            $output = Invoke-VMCommand "powershell -File $vmCodePath"
        }
        default {
            Write-Error-Custom "Unsupported language: $Language"
            return 1
        }
    }

    # Save output
    $output | Out-File -FilePath $OutputFile

    # Cleanup
    Invoke-VMCommand "rmdir /s /q C:\test" | Out-Null

    if ($exitCode -eq 0) {
        Write-Success "Test completed successfully"
        return 0
    } else {
        Write-Error-Custom "Test failed with exit code $exitCode"
        return 1
    }
}

# Create snapshot
function New-Snapshot {
    param([string]$SnapshotName)

    Write-Info "Creating snapshot: $SnapshotName"

    VBoxManage snapshot $VM_NAME take $SnapshotName

    Write-Success "Snapshot created"
}

# Restore snapshot
function Restore-Snapshot {
    param([string]$SnapshotName)

    Write-Info "Restoring snapshot: $SnapshotName"

    VBoxManage snapshot $VM_NAME restore $SnapshotName

    Write-Success "Snapshot restored"
}

# List snapshots
function Get-Snapshots {
    Write-Info "Snapshots:"
    VBoxManage snapshot $VM_NAME list
}

# Install dependencies
function Install-Dependencies {
    Write-Info "Installing dependencies in VM..."

    # Install Chocolatey
    Invoke-VMCommand 'powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString(''https://chocolatey.org/install.ps1''))"'

    # Install packages
    Invoke-VMCommand "choco install -y python nodejs jdk dotnet-sdk"

    Write-Success "Dependencies installed"
}

# Main
Check-VirtualBox

switch ($Command) {
    "start" {
        Start-VM
    }
    "stop" {
        Stop-VM
    }
    "status" {
        Get-VMStatus
    }
    "test" {
        Test-Code -CodeFile $CodeFile -Language $Language -OutputFile $OutputFile
    }
    "exec" {
        Invoke-VMCommand $CodeFile
    }
    "copy-to" {
        Copy-ToVM -LocalFile $CodeFile -RemotePath $Language
    }
    "copy-from" {
        Copy-FromVM -RemotePath $CodeFile -LocalFile $Language
    }
    "snapshot-create" {
        New-Snapshot -SnapshotName $CodeFile
    }
    "snapshot-restore" {
        Restore-Snapshot -SnapshotName $CodeFile
    }
    "snapshot-list" {
        Get-Snapshots
    }
    "install-deps" {
        Install-Dependencies
    }
    "help" {
        Write-Host @"
Claude DevBox - Windows VM Test Script

Usage: .\install_test_windows.ps1 -Command <command> [args]

Commands:
  start                          Start the VM
  stop                           Stop the VM
  status                         Show VM status
  test -CodeFile <file> -Language <lang> -OutputFile <output>
                                 Test code file
  exec -CodeFile <cmd>           Execute command in VM
  copy-to -CodeFile <local> -Language <remote>
                                 Copy file to VM
  copy-from -CodeFile <remote> -Language <local>
                                 Copy file from VM
  snapshot-create -CodeFile <name>
                                 Create snapshot
  snapshot-restore -CodeFile <name>
                                 Restore snapshot
  snapshot-list                  List snapshots
  install-deps                   Install dependencies
  help                           Show this help

Supported languages: python, javascript, java, csharp, powershell
"@
    }
    default {
        Write-Error-Custom "Unknown command: $Command"
        Write-Info "Use -Command help for usage"
    }
}
