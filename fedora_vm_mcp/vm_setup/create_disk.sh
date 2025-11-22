#!/bin/bash
# ============================================================================
# Create QCOW2 Disk Image for Fedora VM
# ============================================================================
# This script creates a new virtual disk image for the Fedora VM
# ============================================================================

set -e

# Default values
DISK_PATH="${1:-/vm/fedora.qcow2}"
DISK_SIZE="${2:-50G}"

echo "============================================================================"
echo "🗄️  Skynet VM Disk Creator"
echo "============================================================================"
echo ""
echo "Creating virtual disk image..."
echo "  Path: $DISK_PATH"
echo "  Size: $DISK_SIZE"
echo ""

# Check if disk already exists
if [ -f "$DISK_PATH" ]; then
    echo "⚠️  Warning: Disk already exists at $DISK_PATH"
    read -p "Do you want to overwrite it? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Aborted."
        exit 1
    fi
    rm -f "$DISK_PATH"
fi

# Create the disk
qemu-img create -f qcow2 "$DISK_PATH" "$DISK_SIZE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! Virtual disk created:"
    echo ""
    qemu-img info "$DISK_PATH"
    echo ""
    echo "💡 Next steps:"
    echo "  1. Download Fedora Workstation ISO"
    echo "  2. Mount it to /vm/fedora.iso"
    echo "  3. Run: /usr/local/bin/launch_vm.sh install"
    echo ""
else
    echo "❌ Failed to create disk image"
    exit 1
fi
