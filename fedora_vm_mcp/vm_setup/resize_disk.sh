#!/bin/bash
# ============================================================================
# Resize QCOW2 Disk Image
# ============================================================================
# This script resizes an existing virtual disk image
# Note: This only expands the virtual disk size. You'll need to resize
# partitions from within the VM using tools like fdisk/parted and resize2fs
# ============================================================================

set -e

DISK_PATH="${1:-/vm/fedora.qcow2}"
NEW_SIZE="${2}"

echo "============================================================================"
echo "📏 Skynet VM Disk Resizer"
echo "============================================================================"
echo ""

# Check if disk exists
if [ ! -f "$DISK_PATH" ]; then
    echo "❌ Disk not found: $DISK_PATH"
    exit 1
fi

# Check if size provided
if [ -z "$NEW_SIZE" ]; then
    echo "❌ New size not specified"
    echo ""
    echo "Usage: $0 <disk_path> <new_size>"
    echo "Example: $0 /vm/fedora.qcow2 +20G"
    echo "         $0 /vm/fedora.qcow2 100G"
    echo ""
    exit 1
fi

# Display current info
echo "📊 Current Disk Information:"
qemu-img info "$DISK_PATH"
echo ""

echo "⚠️  WARNING: Make sure the VM is shut down before resizing!"
echo ""
echo "This will resize the disk to: $NEW_SIZE"
read -p "Continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Resizing disk..."

# Resize the disk
qemu-img resize "$DISK_PATH" "$NEW_SIZE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Disk resized successfully!"
    echo ""
    echo "📊 New Disk Information:"
    qemu-img info "$DISK_PATH"
    echo ""
    echo "⚠️  IMPORTANT: The virtual disk has been expanded, but you still need to:"
    echo ""
    echo "1. Boot the VM"
    echo "2. Resize the partition:"
    echo "   sudo growpart /dev/vda 3  # adjust partition number as needed"
    echo ""
    echo "3. Resize the filesystem:"
    echo "   For ext4: sudo resize2fs /dev/vda3"
    echo "   For xfs:  sudo xfs_growfs /"
    echo "   For LVM:  sudo lvextend -l +100%FREE /dev/mapper/fedora-root"
    echo "             sudo resize2fs /dev/mapper/fedora-root"
    echo ""
else
    echo "❌ Failed to resize disk"
    exit 1
fi
