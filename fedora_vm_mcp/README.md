# 🟣 Fedora VM MCP - Skynet Virtual OS for AI

**A complete virtual operating system environment for AI agents**

This project provides a fully-featured Fedora Workstation environment running inside Docker via QEMU/KVM, giving AI assistants (Claude Code, Gemini CLI, ChatGPT, etc.) access to a real Linux desktop environment for development, testing, graphics work, and system administration.

---

## 🎯 What is This?

Imagine giving an AI assistant access to a complete Linux computer with:
- Full GNOME desktop environment
- Ability to install any software
- Docker for containerized services
- Graphics capabilities
- Development tools (IDE, compilers, debuggers)
- System administration tools
- Network isolation and security

This is exactly what **Fedora VM MCP** provides - a sandboxed virtual machine that AI can control through VNC and SSH, enabling true autonomy for complex tasks.

---

## ✨ Features

- **Full Fedora Workstation** - Complete Linux OS with GNOME
- **QEMU/KVM Virtualization** - Hardware-accelerated when available
- **VNC Access** - Graphical desktop accessible remotely
- **SSH Forwarding** - Terminal access to the VM
- **Docker Container** - Easy deployment and isolation
- **Persistent Storage** - VM disk persists across container restarts
- **Flexible Configuration** - Customizable RAM, CPU, disk size
- **Snapshot Support** - Test changes without risk
- **Multi-VM Ready** - Run multiple isolated VMs

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│ Host Machine (Linux/macOS/Windows + Docker)    │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ Docker Container (Fedora base)            │ │
│  │                                           │ │
│  │  ┌─────────────────────────────────────┐ │ │
│  │  │ QEMU/KVM Virtual Machine            │ │ │
│  │  │                                     │ │ │
│  │  │  ┌───────────────────────────────┐ │ │ │
│  │  │  │ Fedora Workstation + GNOME    │ │ │ │
│  │  │  │                               │ │ │ │
│  │  │  │ - Development Tools           │ │ │ │
│  │  │  │ - Docker                      │ │ │ │
│  │  │  │ - Graphics Software           │ │ │ │
│  │  │  │ - AI Tools                    │ │ │ │
│  │  │  │ - Whatever you install!       │ │ │ │
│  │  │  └───────────────────────────────┘ │ │ │
│  │  │                                     │ │ │
│  │  │  Access via:                        │ │ │
│  │  │  - VNC: :1 (port 5901)             │ │ │
│  │  │  - SSH: port 2222                   │ │ │
│  │  └─────────────────────────────────────┘ │ │
│  │                                           │ │
│  │  TigerVNC Server, libvirt, QEMU           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Ports: 5901 (VNC), 2222 (SSH)                 │
└─────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

### System Requirements

- **Docker** installed and running
- **KVM support** (optional but recommended for performance)
  - Linux: Check with `grep -E 'vmx|svm' /proc/cpuinfo`
  - macOS/Windows: Use Docker Desktop with virtualization enabled
- **8GB+ RAM** recommended (4GB for VM + overhead)
- **50GB+ disk space** for VM image
- **VNC client** (TigerVNC, RealVNC, TightVNC, or any VNC viewer)

### Check KVM Support (Linux only)

```bash
# Check if KVM is available
ls -la /dev/kvm

# Should show:
# crw-rw-rw- 1 root kvm 10, 232 ... /dev/kvm
```

If `/dev/kvm` doesn't exist, the VM will run in emulation mode (slower but still functional).

---

## 🚀 Quick Start

### 1. Build the Docker Image

```bash
cd fedora_vm_mcp
docker build -t fedora-vm-mcp .
```

### 2. Create a VM Disk

```bash
# Create a named volume for persistent storage
docker volume create skynet-vm-data

# Create the virtual disk (50GB)
docker run --rm \
  -v skynet-vm-data:/vm \
  fedora-vm-mcp \
  qemu-img create -f qcow2 /vm/fedora.qcow2 50G
```

### 3. Download Fedora ISO

Download Fedora Workstation from: https://fedoraproject.org/workstation/download

```bash
# Example (adjust version as needed)
wget https://download.fedoraproject.org/pub/fedora/linux/releases/40/Workstation/x86_64/iso/Fedora-Workstation-Live-x86_64-40-1.14.iso
```

### 4. Install Fedora (Interactive)

```bash
# Run container with ISO mounted
docker run -it --rm \
  --name skynet-vm-installer \
  --device /dev/kvm:/dev/kvm \
  -p 5901:5901 \
  -p 2222:2222 \
  -v skynet-vm-data:/vm \
  -v $(pwd)/Fedora-Workstation-Live-x86_64-40-1.14.iso:/vm/fedora.iso:ro \
  -e AUTO_START_VM=true \
  fedora-vm-mcp \
  /usr/local/bin/launch_vm.sh install
```

### 5. Connect via VNC

```bash
# In a new terminal
vncviewer localhost:5901
```

**VNC Password:** `skynet2025`

### 6. Complete Installation in VNC

Follow the Fedora installer:
1. Select language
2. Configure installation destination (use automatic partitioning)
3. Set root password
4. Create user (recommended: username `aiuser`)
5. Begin installation
6. Wait for completion (~10-15 minutes)
7. Reboot when prompted

### 7. Run the VM (After Installation)

```bash
# Stop the installer container
docker stop skynet-vm-installer

# Run normally (boots from disk)
docker run -d \
  --name skynet-vm \
  --device /dev/kvm:/dev/kvm \
  -p 5901:5901 \
  -p 2222:2222 \
  -v skynet-vm-data:/vm \
  --restart unless-stopped \
  fedora-vm-mcp
```

### 8. Connect and Use

**VNC (Graphical):**
```bash
vncviewer localhost:5901
```

**SSH (Terminal):**
```bash
# Wait for VM to boot (~30 seconds)
ssh -p 2222 aiuser@localhost
```

---

## 🎮 Usage for AI Agents

### Claude Code / Claude CLI

Once the VM is running, Claude can interact with it through:

1. **VNC for visual tasks:**
   - Screenshot capture and analysis
   - GUI application testing
   - Graphics work
   - Visual debugging

2. **SSH for terminal tasks:**
   - Installing software
   - Running scripts
   - System administration
   - Development work

**Example Claude Code workflow:**

```bash
# Claude connects to the VM
ssh -p 2222 aiuser@localhost

# Claude can now:
# - Install development tools
sudo dnf install nodejs python3 golang

# - Clone repositories
git clone https://github.com/example/project.git

# - Run tests
cd project && npm test

# - Start services
docker-compose up -d

# - Anything else a human developer would do!
```

### Gemini CLI / ChatGPT CLI

Same approach - use SSH commands to control the VM environment.

---

## 🔧 Configuration

### Environment Variables

Customize the VM by setting environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `VM_DISK` | `/vm/fedora.qcow2` | Path to VM disk image |
| `VM_ISO` | `/vm/fedora.iso` | Path to installation ISO |
| `VM_RAM` | `4096` | RAM in MB |
| `VM_CPUS` | `4` | Number of virtual CPUs |
| `VM_VNC_DISPLAY` | `:1` | VNC display number |
| `VM_SSH_PORT` | `2222` | SSH port forwarding |
| `AUTO_START_VM` | `true` | Auto-start VM on container launch |

**Example:**

```bash
docker run -d \
  --name skynet-vm-powerful \
  --device /dev/kvm:/dev/kvm \
  -p 5901:5901 \
  -p 2222:2222 \
  -v skynet-vm-data:/vm \
  -e VM_RAM=8192 \
  -e VM_CPUS=8 \
  fedora-vm-mcp
```

### Multiple VMs

Run multiple isolated VMs:

```bash
# VM 1
docker run -d \
  --name skynet-vm-dev \
  --device /dev/kvm:/dev/kvm \
  -p 5901:5901 -p 2222:2222 \
  -v skynet-vm-dev:/vm \
  -e VM_DISK=/vm/dev.qcow2 \
  fedora-vm-mcp

# VM 2
docker run -d \
  --name skynet-vm-test \
  --device /dev/kvm:/dev/kvm \
  -p 5902:5901 -p 2223:2222 \
  -v skynet-vm-test:/vm \
  -e VM_DISK=/vm/test.qcow2 \
  -e VM_VNC_DISPLAY=:2 \
  fedora-vm-mcp
```

---

## 📦 Docker Compose

For easier management, use Docker Compose:

**`docker-compose.yml`:**

```yaml
version: '3.8'

services:
  skynet-vm:
    build: .
    container_name: skynet-vm
    devices:
      - /dev/kvm:/dev/kvm
    ports:
      - "5901:5901"  # VNC
      - "2222:2222"  # SSH
    volumes:
      - skynet-vm-data:/vm
      - ./shared:/shared  # Optional shared folder
    environment:
      - VM_RAM=4096
      - VM_CPUS=4
      - AUTO_START_VM=true
    restart: unless-stopped

volumes:
  skynet-vm-data:
```

**Usage:**

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Rebuild
docker-compose up -d --build
```

---

## 🛠️ Helper Scripts

The `vm_setup/` directory contains utility scripts:

### Create Disk

```bash
docker exec -it skynet-vm /vm/vm_setup/create_disk.sh /vm/fedora.qcow2 50G
```

### Resize Disk

```bash
# Shut down VM first!
docker exec -it skynet-vm /vm/vm_setup/resize_disk.sh /vm/fedora.qcow2 +20G

# Then inside the VM, resize the filesystem:
ssh -p 2222 aiuser@localhost
sudo lvextend -l +100%FREE /dev/mapper/fedora-root
sudo resize2fs /dev/mapper/fedora-root
```

### Interactive Installation Guide

```bash
docker exec -it skynet-vm /vm/vm_setup/install_fedora_from_iso.sh
```

---

## 🔒 Security

### Default Credentials

**VNC Password:** `skynet2025`
**Container SSH:** `aiuser` / `aipass2025`
**VM SSH:** Whatever you set during Fedora installation

### Recommendations

1. **Change default passwords** after first deployment
2. **Use SSH keys** instead of passwords for VM access
3. **Don't expose ports** directly to the internet
4. **Use a VPN or SSH tunnel** for remote access
5. **Keep the base image updated:**

```bash
docker pull fedora:latest
docker build -t fedora-vm-mcp .
```

6. **Update the VM regularly:**

```bash
ssh -p 2222 aiuser@localhost
sudo dnf update -y
```

### Firewall Rules

If you need to expose ports externally, use firewall rules:

```bash
# Only allow from specific IP
iptables -A INPUT -p tcp --dport 5901 -s 192.168.1.100 -j ACCEPT
iptables -A INPUT -p tcp --dport 5901 -j DROP
```

---

## 🎯 Advanced Features

### Snapshot Mode (Non-Persistent)

Test changes without affecting the disk:

```bash
docker exec -it skynet-vm /usr/local/bin/launch_vm.sh snapshot
```

All changes will be discarded when the VM shuts down.

### QEMU Monitor

Access the QEMU monitor for advanced control:

```bash
telnet localhost 4444

# Commands:
# info status       - VM status
# savevm snapshot1  - Create snapshot
# loadvm snapshot1  - Restore snapshot
# quit              - Shutdown VM
```

### Shared Folders

Share files between host and VM:

```bash
# Mount a shared folder
docker run -d \
  --name skynet-vm \
  --device /dev/kvm:/dev/kvm \
  -p 5901:5901 -p 2222:2222 \
  -v skynet-vm-data:/vm \
  -v /path/on/host:/shared \
  fedora-vm-mcp

# In the VM, you can access files via SSHFS or NFS
```

### USB Device Passthrough

```bash
# Find USB device
lsusb

# Pass device to container
docker run -d \
  --name skynet-vm \
  --device /dev/kvm:/dev/kvm \
  --device /dev/bus/usb/001/002 \
  -p 5901:5901 -p 2222:2222 \
  -v skynet-vm-data:/vm \
  fedora-vm-mcp
```

---

## 🐛 Troubleshooting

### VM is very slow

**Cause:** KVM not available
**Solution:** Ensure container has access to `/dev/kvm`

```bash
docker run --device /dev/kvm:/dev/kvm ...
```

### VNC shows black screen

**Cause:** VM still booting or VNC not started
**Solution:** Wait 30-60 seconds, or check logs

```bash
docker logs skynet-vm
```

### Cannot connect to SSH port 2222

**Cause:** VM not fully booted or SSH not configured in VM
**Solution:**
1. Wait for VM to fully boot (check via VNC)
2. Inside VM, ensure SSH is enabled:

```bash
sudo systemctl enable sshd
sudo systemctl start sshd
```

### Permission denied on /dev/kvm

**Cause:** User not in kvm group or container lacks permissions
**Solution:** Use `--privileged` or add device explicitly

```bash
docker run --privileged ...
# or
docker run --device /dev/kvm:/dev/kvm ...
```

### Out of disk space in VM

**Cause:** Virtual disk too small
**Solution:** Resize the disk (see Helper Scripts section)

---

## 📊 Performance Tuning

### For Best Performance

```bash
docker run -d \
  --name skynet-vm \
  --device /dev/kvm:/dev/kvm \
  --privileged \
  -p 5901:5901 -p 2222:2222 \
  -v skynet-vm-data:/vm \
  -e VM_RAM=8192 \
  -e VM_CPUS=8 \
  -e VM_VGA=virtio \
  fedora-vm-mcp
```

### CPU Pinning

For dedicated CPU cores:

```bash
docker run -d \
  --cpuset-cpus="0-7" \
  --device /dev/kvm:/dev/kvm \
  ...
```

---

## 🗺️ Use Cases for AI

### Development Environment

AI can set up and manage development environments:
- Install IDEs (VSCode, IntelliJ, etc.)
- Configure build tools
- Run tests
- Debug applications

### System Administration

AI can perform sysadmin tasks:
- Install and configure servers (nginx, PostgreSQL, etc.)
- Manage Docker containers
- Monitor system resources
- Automate maintenance tasks

### Graphics and Design

AI can work with graphical tools:
- GIMP for image editing
- Inkscape for vector graphics
- Blender for 3D modeling
- Screen recording and video editing

### Testing and QA

AI can perform comprehensive testing:
- UI/UX testing via screenshots
- Integration testing
- Performance benchmarking
- Security auditing

### Research and Experimentation

AI can safely experiment:
- Test new software
- Learn new technologies
- Try risky commands in isolation
- Simulate production environments

---

## 🤝 Contributing

Contributions welcome! Areas for improvement:

- Web-based VNC (noVNC integration)
- GPU passthrough for 3D acceleration
- Automated snapshot management
- Pre-configured VM templates
- Integration with MCP protocols
- Multi-agent coordination

See `TODO.md` for planned enhancements.

---

## 📄 License

This project is part of the Skynet AI Infrastructure.

---

## 🙏 Acknowledgments

- **Fedora Project** - For the excellent Linux distribution
- **QEMU/KVM** - For virtualization technology
- **Docker** - For containerization
- **TigerVNC** - For VNC server
- **Anthropic Claude** - For AI assistance in building this project

---

## 📞 Support

For issues, questions, or contributions, please refer to the main Skynet repository.

---

**Built with ❤️ for AI autonomy and human-AI collaboration**

🟣 **Skynet Virtual OS - Empowering AI with Real Computing Environments**
