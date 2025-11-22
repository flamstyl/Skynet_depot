#!/bin/bash
# ============================================================================
# Skynet VM Container - Entrypoint Script
# ============================================================================
# Initializes VNC server, KVM permissions, and launches the Fedora VM
# ============================================================================

set -e

echo "============================================================================"
echo "🟣 Skynet Virtual Machine Container - Fedora VM MCP"
echo "============================================================================"
echo "Starting initialization sequence..."
echo ""

# ============================================================================
# KVM Device Permissions
# ============================================================================
echo "🔧 Configuring KVM device permissions..."
if [ -e /dev/kvm ]; then
    chmod 666 /dev/kvm
    echo "✓ KVM device found and configured: /dev/kvm"
else
    echo "⚠️  WARNING: /dev/kvm not found!"
    echo "   Container must be run with --device /dev/kvm:/dev/kvm"
    echo "   or --privileged for hardware acceleration"
    echo "   VM will run in emulation mode (slower)"
fi

# ============================================================================
# Networking Setup
# ============================================================================
echo ""
echo "🌐 Configuring network forwarding..."
sysctl -w net.ipv4.ip_forward=1 > /dev/null 2>&1 || echo "⚠️  Could not enable IP forwarding (may need --privileged)"

# ============================================================================
# VNC Server Initialization
# ============================================================================
echo ""
echo "🖥️  Starting VNC server on :1 (port 5901)..."

# Kill any existing VNC servers
vncserver -kill :1 > /dev/null 2>&1 || true

# Start VNC server
vncserver :1 -geometry 1920x1080 -depth 24 -localhost no

if [ $? -eq 0 ]; then
    echo "✓ VNC server started successfully"
    echo "  - Display: :1"
    echo "  - Port: 5901"
    echo "  - Resolution: 1920x1080"
    echo "  - Password: skynet2025"
else
    echo "⚠️  VNC server failed to start"
fi

# ============================================================================
# SSH Server (optional, for container access)
# ============================================================================
echo ""
echo "🔐 Starting SSH server..."
/usr/sbin/sshd -D &
echo "✓ SSH server started on port 22 (container)"

# ============================================================================
# VM Disk Check
# ============================================================================
echo ""
echo "💾 Checking VM disk image..."

if [ -f "$VM_DISK" ]; then
    VM_SIZE=$(qemu-img info "$VM_DISK" | grep "virtual size" | awk '{print $3 $4}')
    echo "✓ VM disk found: $VM_DISK"
    echo "  - Size: $VM_SIZE"
else
    echo "⚠️  VM disk not found: $VM_DISK"

    if [ -f "$VM_ISO" ]; then
        echo "📀 Installation ISO found: $VM_ISO"
        echo "  You can install Fedora using: /usr/local/bin/launch_vm.sh install"
    else
        echo "💡 To create a VM disk:"
        echo "  docker exec -it <container> qemu-img create -f qcow2 /vm/fedora.qcow2 50G"
        echo ""
        echo "💡 To install from ISO:"
        echo "  1. Mount ISO to /vm/fedora.iso"
        echo "  2. Run: docker exec -it <container> /usr/local/bin/launch_vm.sh install"
    fi
fi

# ============================================================================
# Launch VM
# ============================================================================
echo ""
echo "🚀 Launching Fedora VM..."
echo "============================================================================"
echo ""

# Check if we should auto-start the VM
if [ "${AUTO_START_VM:-true}" = "true" ] && [ -f "$VM_DISK" ]; then
    echo "▶️  Auto-starting VM with launch_vm.sh..."
    /usr/local/bin/launch_vm.sh &
    VM_PID=$!
    echo "✓ VM process started (PID: $VM_PID)"
else
    echo "⏸️  Auto-start disabled or no disk found"
    echo "   Start manually with: /usr/local/bin/launch_vm.sh"
fi

# ============================================================================
# Connection Information
# ============================================================================
echo ""
echo "============================================================================"
echo "📡 CONNECTION INFORMATION"
echo "============================================================================"
echo ""
echo "🖥️  VNC Access:"
echo "   - Host: <docker-host-ip>"
echo "   - Port: 5901"
echo "   - Display: :1"
echo "   - Password: skynet2025"
echo "   - Command: vncviewer <host>:5901"
echo ""
echo "🔐 SSH Access (once VM is running):"
echo "   - Port: 2222 (forwarded from guest)"
echo "   - User: fedora / aiuser (depending on VM setup)"
echo "   - Command: ssh -p 2222 fedora@<host>"
echo ""
echo "🐳 Container SSH:"
echo "   - Port: 22"
echo "   - User: aiuser"
echo "   - Password: aipass2025"
echo ""
echo "============================================================================"
echo "✅ Skynet VM Container Ready"
echo "============================================================================"
echo ""

# ============================================================================
# Keep Container Running
# ============================================================================
# If a command was passed, execute it, otherwise keep running
if [ $# -eq 0 ]; then
    echo "💤 Container running in daemon mode. Press Ctrl+C to stop."
    echo "   Logs: docker logs -f <container>"
    echo "   Shell: docker exec -it <container> /bin/bash"
    echo ""

    # Keep alive and monitor VM process if it exists
    if [ ! -z "$VM_PID" ]; then
        wait $VM_PID
        echo "⚠️  VM process exited"
    else
        # Just sleep forever
        tail -f /dev/null
    fi
else
    # Execute provided command
    echo "▶️  Executing command: $@"
    exec "$@"
fi
