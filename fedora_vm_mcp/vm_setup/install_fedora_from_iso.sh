#!/bin/bash
# ============================================================================
# Fedora Installation Helper
# ============================================================================
# Guides through the installation of Fedora Workstation from ISO
# ============================================================================

set -e

VM_DISK="${VM_DISK:-/vm/fedora.qcow2}"
VM_ISO="${VM_ISO:-/vm/fedora.iso}"

echo "============================================================================"
echo "📀 Skynet VM - Fedora Installation Guide"
echo "============================================================================"
echo ""

# Check for disk
if [ ! -f "$VM_DISK" ]; then
    echo "❌ VM disk not found: $VM_DISK"
    echo ""
    echo "Create a disk first:"
    echo "  ./create_disk.sh $VM_DISK 50G"
    echo ""
    exit 1
fi

echo "✓ VM disk found: $VM_DISK"

# Check for ISO
if [ ! -f "$VM_ISO" ]; then
    echo "❌ Fedora ISO not found: $VM_ISO"
    echo ""
    echo "Download Fedora Workstation ISO from:"
    echo "  https://fedoraproject.org/workstation/download"
    echo ""
    echo "Then mount it as a volume:"
    echo "  docker run -v /path/to/fedora.iso:/vm/fedora.iso ..."
    echo ""
    exit 1
fi

echo "✓ Fedora ISO found: $VM_ISO"
echo ""

# Display disk info
echo "📊 Disk Information:"
qemu-img info "$VM_DISK"
echo ""

# Display ISO info
echo "📀 ISO Information:"
ISO_SIZE=$(du -h "$VM_ISO" | cut -f1)
echo "  Size: $ISO_SIZE"
echo ""

echo "============================================================================"
echo "🚀 Starting Fedora Installation"
echo "============================================================================"
echo ""
echo "The VM will boot from the ISO. Follow these steps:"
echo ""
echo "1. Connect to VNC:"
echo "   vncviewer <host>:5901"
echo "   Password: skynet2025"
echo ""
echo "2. In the Fedora installer:"
echo "   - Select language"
echo "   - Configure installation destination (automatic partitioning is fine)"
echo "   - Set root password and create a user (recommend username: aiuser)"
echo "   - Begin installation"
echo ""
echo "3. After installation:"
echo "   - Reboot the VM"
echo "   - Stop this container"
echo "   - Restart without the ISO (normal boot mode)"
echo ""
echo "Press ENTER to launch the installer..."
read

# Launch VM in install mode
exec /usr/local/bin/launch_vm.sh install
