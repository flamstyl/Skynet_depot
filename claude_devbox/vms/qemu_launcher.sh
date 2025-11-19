#!/bin/bash

# Claude DevBox - QEMU VM Launcher
# Manages Linux VM for testing

set -e

VM_NAME="devbox-linux-test"
VM_IMAGE="./images/ubuntu-22.04.qcow2"
VM_MEMORY="2048"
VM_CPUS="2"
SSH_PORT="2222"
VNC_PORT="5900"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if QEMU is installed
check_qemu() {
    if ! command -v qemu-system-x86_64 &> /dev/null; then
        log_error "QEMU is not installed"
        log_info "Install with: sudo apt-get install qemu-kvm qemu-system-x86"
        exit 1
    fi
    log_info "QEMU installed: $(qemu-system-x86_64 --version | head -n1)"
}

# Create VM image if it doesn't exist
create_image() {
    if [ ! -f "$VM_IMAGE" ]; then
        log_warn "VM image not found: $VM_IMAGE"
        log_info "Creating new image..."

        mkdir -p "$(dirname "$VM_IMAGE")"

        # Download Ubuntu cloud image
        local UBUNTU_IMAGE_URL="https://cloud-images.ubuntu.com/releases/22.04/release/ubuntu-22.04-server-cloudimg-amd64.img"
        local TEMP_IMAGE="/tmp/ubuntu-22.04-cloud.img"

        log_info "Downloading Ubuntu 22.04 cloud image..."
        wget -q --show-progress -O "$TEMP_IMAGE" "$UBUNTU_IMAGE_URL"

        # Convert to qcow2 and resize
        log_info "Converting and resizing image..."
        qemu-img convert -f qcow2 -O qcow2 "$TEMP_IMAGE" "$VM_IMAGE"
        qemu-img resize "$VM_IMAGE" +10G

        rm "$TEMP_IMAGE"

        log_info "✓ VM image created: $VM_IMAGE"
    else
        log_info "VM image found: $VM_IMAGE"
    fi
}

# Start VM
start_vm() {
    log_info "Starting VM: $VM_NAME"

    # Check if VM is already running
    if pgrep -f "qemu.*$VM_NAME" > /dev/null; then
        log_warn "VM is already running"
        return 0
    fi

    qemu-system-x86_64 \
        -name "$VM_NAME" \
        -m "$VM_MEMORY" \
        -smp "$VM_CPUS" \
        -hda "$VM_IMAGE" \
        -nographic \
        -device e1000,netdev=net0 \
        -netdev user,id=net0,hostfwd=tcp::${SSH_PORT}-:22,hostfwd=tcp::8080-:8080 \
        -enable-kvm \
        -daemonize \
        -pidfile "/tmp/${VM_NAME}.pid"

    log_info "✓ VM started (SSH port: $SSH_PORT)"
}

# Stop VM
stop_vm() {
    log_info "Stopping VM: $VM_NAME"

    local PID_FILE="/tmp/${VM_NAME}.pid"

    if [ -f "$PID_FILE" ]; then
        local PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            rm "$PID_FILE"
            log_info "✓ VM stopped"
        else
            log_warn "VM not running (stale PID file)"
            rm "$PID_FILE"
        fi
    else
        # Try to find process by name
        local PID=$(pgrep -f "qemu.*$VM_NAME")
        if [ -n "$PID" ]; then
            kill "$PID"
            log_info "✓ VM stopped"
        else
            log_warn "VM not running"
        fi
    fi
}

# VM status
status_vm() {
    if pgrep -f "qemu.*$VM_NAME" > /dev/null; then
        log_info "VM Status: ${GREEN}Running${NC}"
        log_info "SSH: ssh -p $SSH_PORT user@localhost"
        return 0
    else
        log_info "VM Status: ${RED}Stopped${NC}"
        return 1
    fi
}

# SSH into VM
ssh_vm() {
    log_info "Connecting to VM via SSH..."
    ssh -p "$SSH_PORT" \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        devbox@localhost
}

# Execute command in VM
exec_vm() {
    local COMMAND="$1"

    log_info "Executing command in VM: $COMMAND"

    ssh -p "$SSH_PORT" \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        devbox@localhost \
        "$COMMAND"
}

# Copy file to VM
copy_to_vm() {
    local LOCAL_FILE="$1"
    local REMOTE_PATH="$2"

    log_info "Copying $LOCAL_FILE to VM:$REMOTE_PATH"

    scp -P "$SSH_PORT" \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        "$LOCAL_FILE" \
        "devbox@localhost:$REMOTE_PATH"
}

# Copy file from VM
copy_from_vm() {
    local REMOTE_PATH="$1"
    local LOCAL_FILE="$2"

    log_info "Copying VM:$REMOTE_PATH to $LOCAL_FILE"

    scp -P "$SSH_PORT" \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        "devbox@localhost:$REMOTE_PATH" \
        "$LOCAL_FILE"
}

# Snapshot management
create_snapshot() {
    local SNAPSHOT_NAME="$1"

    log_info "Creating snapshot: $SNAPSHOT_NAME"

    qemu-img snapshot -c "$SNAPSHOT_NAME" "$VM_IMAGE"

    log_info "✓ Snapshot created"
}

restore_snapshot() {
    local SNAPSHOT_NAME="$1"

    log_info "Restoring snapshot: $SNAPSHOT_NAME"

    qemu-img snapshot -a "$SNAPSHOT_NAME" "$VM_IMAGE"

    log_info "✓ Snapshot restored"
}

list_snapshots() {
    log_info "Snapshots:"
    qemu-img snapshot -l "$VM_IMAGE"
}

# Main
main() {
    local COMMAND="${1:-help}"

    check_qemu

    case "$COMMAND" in
        start)
            create_image
            start_vm
            ;;
        stop)
            stop_vm
            ;;
        restart)
            stop_vm
            sleep 2
            start_vm
            ;;
        status)
            status_vm
            ;;
        ssh)
            ssh_vm
            ;;
        exec)
            shift
            exec_vm "$*"
            ;;
        copy-to)
            copy_to_vm "$2" "$3"
            ;;
        copy-from)
            copy_from_vm "$2" "$3"
            ;;
        snapshot-create)
            create_snapshot "$2"
            ;;
        snapshot-restore)
            restore_snapshot "$2"
            ;;
        snapshot-list)
            list_snapshots
            ;;
        help|*)
            echo "Claude DevBox - QEMU VM Launcher"
            echo ""
            echo "Usage: $0 <command> [args]"
            echo ""
            echo "Commands:"
            echo "  start              Start the VM"
            echo "  stop               Stop the VM"
            echo "  restart            Restart the VM"
            echo "  status             Show VM status"
            echo "  ssh                SSH into the VM"
            echo "  exec <cmd>         Execute command in VM"
            echo "  copy-to <local> <remote>   Copy file to VM"
            echo "  copy-from <remote> <local> Copy file from VM"
            echo "  snapshot-create <name>     Create snapshot"
            echo "  snapshot-restore <name>    Restore snapshot"
            echo "  snapshot-list              List snapshots"
            echo "  help               Show this help"
            ;;
    esac
}

main "$@"
