#!/bin/bash
# ============================================================================
# Skynet VM Launcher - QEMU/KVM VM Launch Script
# ============================================================================
# Launches Fedora Workstation VM with optimized settings for AI agent use
# ============================================================================

set -e

# ============================================================================
# Configuration Variables (can be overridden by environment)
# ============================================================================
VM_NAME="${VM_NAME:-skynet-fedora}"
VM_DISK="${VM_DISK:-/vm/fedora.qcow2}"
VM_ISO="${VM_ISO:-/vm/fedora.iso}"
VM_RAM="${VM_RAM:-4096}"
VM_CPUS="${VM_CPUS:-4}"
VM_VGA="${VM_VGA:-std}"
VM_VNC_DISPLAY="${VM_VNC_DISPLAY:-:1}"
VM_SSH_PORT="${VM_SSH_PORT:-2222}"
VM_NETWORK="${VM_NETWORK:-user}"

# Boot options
VM_BOOT="${VM_BOOT:-c}"  # c=disk, d=cdrom

# Snapshot mode
SNAPSHOT_MODE="${SNAPSHOT_MODE:-off}"

# ============================================================================
# Color Output
# ============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================
log_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ============================================================================
# Check KVM Support
# ============================================================================
check_kvm() {
    if [ -e /dev/kvm ] && [ -r /dev/kvm ] && [ -w /dev/kvm ]; then
        log_success "KVM acceleration available"
        echo "-enable-kvm"
    else
        log_warning "KVM not available - using QEMU emulation (slower)"
        echo ""
    fi
}

# ============================================================================
# Mode Detection
# ============================================================================
MODE="${1:-normal}"

echo ""
echo "============================================================================"
echo -e "${PURPLE}🚀 Skynet VM Launcher${NC}"
echo "============================================================================"
echo ""

# ============================================================================
# Pre-flight Checks
# ============================================================================
log_info "Running pre-flight checks..."

# Check QEMU installation
if ! command -v qemu-system-x86_64 &> /dev/null; then
    log_error "qemu-system-x86_64 not found!"
    exit 1
fi
log_success "QEMU found: $(qemu-system-x86_64 --version | head -n1)"

# Check KVM
KVM_FLAG=$(check_kvm)

# ============================================================================
# Mode: Install (from ISO)
# ============================================================================
if [ "$MODE" = "install" ] || [ "$MODE" = "iso" ]; then
    echo ""
    log_info "🔧 Install Mode - Booting from ISO"
    echo ""

    # Check if ISO exists
    if [ ! -f "$VM_ISO" ]; then
        log_error "ISO not found: $VM_ISO"
        log_info "Please mount a Fedora ISO to $VM_ISO"
        exit 1
    fi
    log_success "ISO found: $VM_ISO"

    # Check if disk exists, create if not
    if [ ! -f "$VM_DISK" ]; then
        log_warning "Disk not found, creating new disk: $VM_DISK"
        qemu-img create -f qcow2 "$VM_DISK" 50G
        log_success "Created 50GB disk image"
    else
        log_warning "Using existing disk: $VM_DISK"
    fi

    VM_BOOT="d"  # Boot from CD-ROM
    CDROM_FLAG="-cdrom $VM_ISO"

# ============================================================================
# Mode: Normal (boot from disk)
# ============================================================================
elif [ "$MODE" = "normal" ] || [ "$MODE" = "boot" ] || [ "$MODE" = "start" ]; then
    echo ""
    log_info "▶️  Normal Mode - Booting from disk"
    echo ""

    # Check if disk exists
    if [ ! -f "$VM_DISK" ]; then
        log_error "VM disk not found: $VM_DISK"
        log_info "Create a disk with: qemu-img create -f qcow2 $VM_DISK 50G"
        log_info "Or run in install mode: $0 install"
        exit 1
    fi
    log_success "Disk found: $VM_DISK"

    VM_BOOT="c"  # Boot from hard disk
    CDROM_FLAG=""

# ============================================================================
# Mode: Snapshot (non-persistent)
# ============================================================================
elif [ "$MODE" = "snapshot" ]; then
    echo ""
    log_info "📸 Snapshot Mode - Changes will not be saved"
    echo ""

    if [ ! -f "$VM_DISK" ]; then
        log_error "VM disk not found: $VM_DISK"
        exit 1
    fi

    SNAPSHOT_MODE="on"
    VM_BOOT="c"
    CDROM_FLAG=""

# ============================================================================
# Mode: Help
# ============================================================================
else
    echo "Usage: $0 [mode]"
    echo ""
    echo "Modes:"
    echo "  normal     - Boot from disk (default)"
    echo "  install    - Boot from ISO for installation"
    echo "  snapshot   - Boot in snapshot mode (changes not saved)"
    echo ""
    echo "Environment Variables:"
    echo "  VM_DISK      - Path to VM disk (default: /vm/fedora.qcow2)"
    echo "  VM_ISO       - Path to installation ISO (default: /vm/fedora.iso)"
    echo "  VM_RAM       - RAM in MB (default: 4096)"
    echo "  VM_CPUS      - Number of CPUs (default: 4)"
    echo "  VM_SSH_PORT  - SSH port forwarding (default: 2222)"
    echo ""
    exit 0
fi

# ============================================================================
# Display Configuration
# ============================================================================
echo ""
log_info "VM Configuration:"
echo "  - Name:        $VM_NAME"
echo "  - Disk:        $VM_DISK"
echo "  - RAM:         ${VM_RAM}M"
echo "  - CPUs:        $VM_CPUS"
echo "  - VGA:         $VM_VGA"
echo "  - VNC:         $VM_VNC_DISPLAY (port 5901)"
echo "  - SSH Port:    $VM_SSH_PORT"
echo "  - Boot:        $([ "$VM_BOOT" = "c" ] && echo "Disk" || echo "CD-ROM")"
echo "  - Network:     $VM_NETWORK"
echo "  - Snapshot:    $SNAPSHOT_MODE"
echo "  - KVM:         $([ -n "$KVM_FLAG" ] && echo "Enabled" || echo "Disabled (emulation)")"
echo ""

# ============================================================================
# Build QEMU Command
# ============================================================================
log_info "Building QEMU command..."

QEMU_CMD=(
    qemu-system-x86_64

    # Machine type
    -machine q35

    # CPU
    -cpu host
    -smp "$VM_CPUS"

    # Memory
    -m "$VM_RAM"

    # Disk
    -drive "file=${VM_DISK},format=qcow2,if=virtio"

    # Network - User mode with port forwarding
    -netdev "user,id=net0,hostfwd=tcp::${VM_SSH_PORT}-:22"
    -device "virtio-net-pci,netdev=net0"

    # Display - VNC
    -vnc "${VM_VNC_DISPLAY}"
    -vga "$VM_VGA"

    # Boot order
    -boot "order=${VM_BOOT}"

    # RTC
    -rtc base=utc,clock=host

    # USB
    -usb
    -device usb-tablet

    # Serial console (for debugging)
    -serial stdio

    # Monitor
    -monitor telnet:127.0.0.1:4444,server,nowait

    # Name
    -name "$VM_NAME"
)

# Add KVM if available
if [ -n "$KVM_FLAG" ]; then
    QEMU_CMD+=("$KVM_FLAG")
fi

# Add CD-ROM if in install mode
if [ -n "$CDROM_FLAG" ]; then
    QEMU_CMD+=($CDROM_FLAG)
fi

# Add snapshot mode if enabled
if [ "$SNAPSHOT_MODE" = "on" ]; then
    QEMU_CMD+=("-snapshot")
fi

# ============================================================================
# Launch VM
# ============================================================================
echo ""
log_info "Launching QEMU..."
echo ""
echo "============================================================================"
log_success "VM Starting - Skynet Fedora Virtual Machine"
echo "============================================================================"
echo ""
log_info "VNC Display: $VM_VNC_DISPLAY (port 5901)"
log_info "SSH Port:    $VM_SSH_PORT (forwards to VM port 22)"
log_info "Monitor:     telnet localhost 4444"
echo ""
log_info "Connect with: vncviewer <host>:5901"
echo ""
echo "============================================================================"
echo ""

# Execute QEMU
exec "${QEMU_CMD[@]}"
