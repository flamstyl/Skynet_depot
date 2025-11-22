# VM Setup Scripts

This directory contains helper scripts for managing the Fedora VM disk and installation.

## Scripts Overview

### 1. `create_disk.sh`
Creates a new QCOW2 virtual disk image for the Fedora VM.

**Usage:**
```bash
./create_disk.sh [disk_path] [size]

# Examples:
./create_disk.sh /vm/fedora.qcow2 50G
./create_disk.sh /vm/myvm.qcow2 100G
```

**Default values:**
- Disk path: `/vm/fedora.qcow2`
- Size: `50G`

---

### 2. `install_fedora_from_iso.sh`
Interactive guide for installing Fedora Workstation from an ISO file.

**Prerequisites:**
- Virtual disk must exist (created with `create_disk.sh`)
- Fedora ISO must be mounted at `/vm/fedora.iso`

**Usage:**
```bash
./install_fedora_from_iso.sh
```

**The script will:**
1. Verify disk and ISO exist
2. Provide installation instructions
3. Launch the VM in installation mode
4. Guide you through VNC connection

---

### 3. `resize_disk.sh`
Expands the virtual disk size (VM must be shut down).

**Usage:**
```bash
./resize_disk.sh <disk_path> <new_size>

# Examples:
./resize_disk.sh /vm/fedora.qcow2 +20G   # Add 20GB
./resize_disk.sh /vm/fedora.qcow2 100G    # Resize to 100GB total
```

**Important:**
- This only expands the virtual disk container
- You must resize partitions and filesystems from within the VM afterward

**After resizing, inside the VM:**
```bash
# 1. Resize partition
sudo growpart /dev/vda 3

# 2. Resize filesystem
# For ext4:
sudo resize2fs /dev/vda3

# For XFS:
sudo xfs_growfs /

# For LVM:
sudo lvextend -l +100%FREE /dev/mapper/fedora-root
sudo resize2fs /dev/mapper/fedora-root
```

---

## Quick Start Workflow

### First-time Setup

1. **Create the virtual disk:**
   ```bash
   docker exec -it skynet-vm bash
   cd /vm
   ./vm_setup/create_disk.sh /vm/fedora.qcow2 50G
   ```

2. **Download Fedora ISO:**
   ```bash
   # On your host machine:
   wget https://download.fedoraproject.org/pub/fedora/linux/releases/40/Workstation/x86_64/iso/Fedora-Workstation-Live-x86_64-40-1.14.iso
   ```

3. **Mount the ISO and run the container:**
   ```bash
   docker run -d \
     --name skynet-vm \
     --device /dev/kvm:/dev/kvm \
     -p 5901:5901 \
     -p 2222:2222 \
     -v /path/to/fedora.iso:/vm/fedora.iso:ro \
     -v skynet-vm-data:/vm \
     fedora-vm-mcp
   ```

4. **Install Fedora:**
   ```bash
   docker exec -it skynet-vm /vm/vm_setup/install_fedora_from_iso.sh
   ```

5. **Connect via VNC:**
   ```bash
   vncviewer localhost:5901
   # Password: skynet2025
   ```

6. **After installation, restart without ISO:**
   ```bash
   docker stop skynet-vm
   docker run -d \
     --name skynet-vm \
     --device /dev/kvm:/dev/kvm \
     -p 5901:5901 \
     -p 2222:2222 \
     -v skynet-vm-data:/vm \
     fedora-vm-mcp
   ```

---

## Maintenance

### Expand Disk Space

If you run out of space in the VM:

```bash
# 1. Shut down the VM
docker exec -it skynet-vm bash
# Inside container, use QEMU monitor or stop VM gracefully

# 2. Resize the disk
./vm_setup/resize_disk.sh /vm/fedora.qcow2 +20G

# 3. Restart the VM and resize the filesystem (see resize_disk.sh output)
```

---

## Troubleshooting

### Disk not found
- Ensure the volume is correctly mounted
- Check that the disk was created in the correct location

### ISO boot fails
- Verify ISO is a valid Fedora Workstation ISO
- Ensure ISO is mounted as read-only
- Check ISO integrity (checksum)

### VNC connection refused
- Verify VNC server is running: `ps aux | grep vnc`
- Check port mapping: `docker port skynet-vm`
- Ensure firewall allows port 5901

---

## Advanced Usage

### Create Multiple VMs

```bash
# Create separate disks
./create_disk.sh /vm/vm1.qcow2 30G
./create_disk.sh /vm/vm2.qcow2 30G

# Launch with environment variables
VM_DISK=/vm/vm1.qcow2 VM_SSH_PORT=2223 /usr/local/bin/launch_vm.sh
```

### Snapshot Management

```bash
# Create a snapshot
qemu-img snapshot -c snapshot1 /vm/fedora.qcow2

# List snapshots
qemu-img snapshot -l /vm/fedora.qcow2

# Restore snapshot
qemu-img snapshot -a snapshot1 /vm/fedora.qcow2
```

### Convert Disk Format

```bash
# Convert to raw (for better performance)
qemu-img convert -f qcow2 -O raw /vm/fedora.qcow2 /vm/fedora.raw

# Compress QCOW2
qemu-img convert -f qcow2 -O qcow2 -c /vm/fedora.qcow2 /vm/fedora-compressed.qcow2
```

---

## Resources

- [Fedora Downloads](https://fedoraproject.org/workstation/download)
- [QEMU Documentation](https://www.qemu.org/docs/master/)
- [KVM Documentation](https://www.linux-kvm.org/page/Documents)
