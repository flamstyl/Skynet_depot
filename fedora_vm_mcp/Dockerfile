# ============================================================================
# Skynet Virtual Machine Container - Fedora VM MCP
# ============================================================================
# Docker container running a full Fedora Workstation VM with GNOME
# Accessible via VNC and SSH for AI agents (Claude, Gemini, ChatGPT, etc.)
# ============================================================================

FROM fedora:latest

LABEL maintainer="Skynet AI Infrastructure"
LABEL description="QEMU/KVM Fedora VM with VNC access for AI autonomy"
LABEL version="1.0.0"

# ============================================================================
# Environment Variables
# ============================================================================
ENV DISPLAY=:1 \
    VNC_PORT=5901 \
    SSH_PORT=2222 \
    VM_RAM=4096 \
    VM_CPUS=4 \
    VM_DISK=/vm/fedora.qcow2 \
    VM_ISO=/vm/fedora.iso \
    DEBIAN_FRONTEND=noninteractive

# ============================================================================
# System Update & Core Dependencies
# ============================================================================
RUN dnf update -y && \
    dnf install -y \
    # QEMU/KVM Virtualization
    qemu-kvm \
    qemu-img \
    libvirt \
    libvirt-daemon-kvm \
    virt-install \
    virt-manager \
    virt-viewer \
    # VNC Server & X11
    tigervnc-server \
    xorg-x11-server-Xvfb \
    xorg-x11-xauth \
    xorg-x11-fonts-Type1 \
    xorg-x11-fonts-misc \
    # Networking
    bridge-utils \
    iproute \
    iptables \
    openssh-server \
    openssh-clients \
    # System Tools
    sudo \
    wget \
    curl \
    vim \
    nano \
    htop \
    tmux \
    screen \
    git \
    # Compression & File Management
    tar \
    gzip \
    bzip2 \
    xz \
    unzip \
    # Python for automation
    python3 \
    python3-pip \
    # Development tools
    gcc \
    make \
    # Monitoring
    procps-ng \
    net-tools \
    && dnf clean all

# ============================================================================
# VNC Configuration
# ============================================================================
RUN mkdir -p /root/.vnc && \
    echo "skynet2025" | vncpasswd -f > /root/.vnc/passwd && \
    chmod 600 /root/.vnc/passwd

# Create VNC xstartup script for minimal window manager
RUN echo '#!/bin/bash' > /root/.vnc/xstartup && \
    echo 'unset SESSION_MANAGER' >> /root/.vnc/xstartup && \
    echo 'unset DBUS_SESSION_BUS_ADDRESS' >> /root/.vnc/xstartup && \
    echo 'exec /bin/bash' >> /root/.vnc/xstartup && \
    chmod +x /root/.vnc/xstartup

# ============================================================================
# AI User Setup
# ============================================================================
# Create aiuser with sudo privileges - this is the primary user for AI agents
RUN useradd -m -s /bin/bash -G wheel aiuser && \
    echo "aiuser:aipass2025" | chpasswd && \
    echo "aiuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Configure aiuser VNC
RUN mkdir -p /home/aiuser/.vnc && \
    echo "aiuser2025" | vncpasswd -f > /home/aiuser/.vnc/passwd && \
    chmod 600 /home/aiuser/.vnc/passwd && \
    chown -R aiuser:aiuser /home/aiuser/.vnc

RUN echo '#!/bin/bash' > /home/aiuser/.vnc/xstartup && \
    echo 'unset SESSION_MANAGER' >> /home/aiuser/.vnc/xstartup && \
    echo 'unset DBUS_SESSION_BUS_ADDRESS' >> /home/aiuser/.vnc/xstartup && \
    echo 'exec /bin/bash' >> /home/aiuser/.vnc/xstartup && \
    chmod +x /home/aiuser/.vnc/xstartup && \
    chown aiuser:aiuser /home/aiuser/.vnc/xstartup

# ============================================================================
# KVM/QEMU Permissions
# ============================================================================
RUN usermod -a -G kvm root && \
    usermod -a -G kvm aiuser && \
    chmod 666 /dev/kvm || true

# ============================================================================
# VM Storage Setup
# ============================================================================
RUN mkdir -p /vm /vm/iso /vm/images && \
    chmod 755 /vm /vm/iso /vm/images && \
    chown -R aiuser:aiuser /vm

# ============================================================================
# SSH Configuration
# ============================================================================
RUN ssh-keygen -A && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# ============================================================================
# Networking - Enable IP forwarding for VM networking
# ============================================================================
RUN echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf

# ============================================================================
# Scripts
# ============================================================================
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
COPY launch_vm.sh /usr/local/bin/launch_vm.sh
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/launch_vm.sh

# ============================================================================
# Volume Mounts
# ============================================================================
# /vm - VM disk images and ISOs
# /shared - Shared data between host and container
VOLUME ["/vm", "/shared"]

# ============================================================================
# Exposed Ports
# ============================================================================
# 5901 - VNC Server
# 2222 - SSH forwarded from guest VM
# 22   - Container SSH
EXPOSE 5901 2222 22

# ============================================================================
# Working Directory
# ============================================================================
WORKDIR /vm

# ============================================================================
# Entrypoint
# ============================================================================
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/bin/bash"]
