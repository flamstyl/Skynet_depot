# ================================================================
# 🤖 Fedora Server MCP - AI Virtual Machine
# ================================================================
# Base image: Fedora Server latest
# Purpose: Complete Linux environment for AI agents
# Features: root access, sudo, DNF, networking, persistent memory
# Compatible with: Claude CLI, Gemini CLI, GPT-4 CLI, Comet Agents
# ================================================================

FROM fedora:latest

# ================================================================
# 🔧 METADATA
# ================================================================
LABEL maintainer="Skynet Depot AI Team"
LABEL description="Fedora Server MCP - AI Virtual Machine with full system access"
LABEL version="1.0.0"

# ================================================================
# 🌍 ENVIRONMENT VARIABLES
# ================================================================
ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8
ENV TERM=xterm-256color
ENV AI_USER=ia
ENV AI_HOME=/home/ia
ENV MCP_PATH=/mcp
ENV DATA_PATH=/data
ENV MCP_LOG_PATH=/var/log/mcp

# ================================================================
# 📦 SYSTEM UPDATE & CORE PACKAGES
# ================================================================
RUN dnf update -y && \
    dnf install -y \
    sudo \
    dnf-plugins-core \
    wget \
    curl \
    git \
    nano \
    vim \
    python3 \
    python3-pip \
    openssh-clients \
    openssh-server \
    inotify-tools \
    htop \
    procps-ng \
    net-tools \
    iputils \
    bind-utils \
    tar \
    gzip \
    unzip \
    jq \
    tmux \
    screen \
    which \
    findutils \
    hostname \
    passwd \
    shadow-utils \
    systemd \
    && dnf clean all

# ================================================================
# 👤 CREATE AI USER WITH SUDO ACCESS
# ================================================================
RUN useradd -m -s /bin/bash -d ${AI_HOME} ${AI_USER} && \
    echo "${AI_USER}:skynet2025" | chpasswd && \
    echo "${AI_USER} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers && \
    mkdir -p ${AI_HOME}/.ssh && \
    chmod 700 ${AI_HOME}/.ssh

# ================================================================
# 📁 CREATE DIRECTORY STRUCTURE
# ================================================================
RUN mkdir -p ${MCP_PATH} \
    ${MCP_PATH}/memory \
    ${MCP_PATH}/memory/logs \
    ${DATA_PATH} \
    ${MCP_LOG_PATH} && \
    chown -R ${AI_USER}:${AI_USER} ${MCP_PATH} ${DATA_PATH} ${MCP_LOG_PATH} && \
    chmod -R 755 ${MCP_PATH} ${DATA_PATH} ${MCP_LOG_PATH}

# ================================================================
# 🐍 PYTHON ENVIRONMENT
# ================================================================
RUN pip3 install --upgrade pip && \
    pip3 install \
    anthropic \
    openai \
    google-generativeai \
    requests \
    pyyaml \
    markdown \
    watchdog

# ================================================================
# 🔑 SSH CONFIGURATION (disabled by default)
# ================================================================
RUN ssh-keygen -A && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# ================================================================
# 📋 COPY MCP SCRIPTS
# ================================================================
COPY mcp/ ${MCP_PATH}/
COPY mcp_start.sh /usr/local/bin/mcp_start.sh

RUN chmod +x /usr/local/bin/mcp_start.sh && \
    chmod +x ${MCP_PATH}/*.sh 2>/dev/null || true && \
    chown -R ${AI_USER}:${AI_USER} ${MCP_PATH}

# ================================================================
# 🎯 AI USER ENVIRONMENT SETUP
# ================================================================
USER ${AI_USER}
WORKDIR ${AI_HOME}

# Create AI user profile
RUN echo 'export PS1="[\u@AI-VM \W]\$ "' >> ${AI_HOME}/.bashrc && \
    echo 'export PATH=$PATH:/usr/local/bin' >> ${AI_HOME}/.bashrc && \
    echo 'alias ll="ls -lah"' >> ${AI_HOME}/.bashrc && \
    echo 'alias mcp="cd /mcp"' >> ${AI_HOME}/.bashrc && \
    echo 'alias logs="cd /var/log/mcp"' >> ${AI_HOME}/.bashrc && \
    echo 'alias data="cd /data"' >> ${AI_HOME}/.bashrc && \
    echo 'echo "🤖 Fedora Server MCP - AI Virtual Machine"' >> ${AI_HOME}/.bashrc && \
    echo 'echo "Type: mcp to go to MCP directory"' >> ${AI_HOME}/.bashrc && \
    echo 'echo "Type: logs to see MCP logs"' >> ${AI_HOME}/.bashrc && \
    echo 'echo "Type: data to access persistent data"' >> ${AI_HOME}/.bashrc

# ================================================================
# 🚀 STARTUP
# ================================================================
USER root

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health 2>/dev/null || ping -c 1 1.1.1.1 || exit 1

# Expose SSH port (optional)
EXPOSE 22

# Default command
CMD ["/usr/local/bin/mcp_start.sh"]
