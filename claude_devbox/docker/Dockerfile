# Claude DevBox - Sandbox Docker Image
# Multi-language development environment with internet access

FROM ubuntu:22.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Set labels
LABEL maintainer="Skynet DevBox"
LABEL description="Claude DevBox Autonomous Development Sandbox"
LABEL version="1.0.0"

# Install system essentials and networking tools
RUN apt-get update && apt-get install -y \
    # Core tools
    curl \
    wget \
    git \
    vim \
    nano \
    htop \
    tmux \
    zip \
    unzip \
    tar \
    gzip \
    # Network tools
    net-tools \
    iputils-ping \
    dnsutils \
    netcat \
    telnet \
    # SSL/TLS
    ca-certificates \
    openssl \
    # Build tools
    build-essential \
    gcc \
    g++ \
    make \
    cmake \
    autoconf \
    automake \
    libtool \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# ============================================================================
# PYTHON
# ============================================================================
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    python3-venv \
    python3-setuptools \
    python3-wheel \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install common Python packages
RUN python3 -m pip install --upgrade pip && \
    pip3 install --no-cache-dir \
    requests \
    beautifulsoup4 \
    lxml \
    numpy \
    pandas \
    matplotlib \
    pytest \
    pylint \
    black \
    mypy \
    ipython \
    jupyter

# ============================================================================
# NODE.JS & NPM
# ============================================================================
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install global npm packages
RUN npm install -g \
    typescript \
    ts-node \
    eslint \
    prettier \
    nodemon \
    pm2 \
    yarn

# ============================================================================
# JAVA
# ============================================================================
RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
    openjdk-17-jre \
    maven \
    gradle \
    && rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# ============================================================================
# RUST
# ============================================================================
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

ENV PATH="/root/.cargo/bin:${PATH}"

RUN rustup component add rustfmt clippy

# ============================================================================
# GO
# ============================================================================
RUN wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz && \
    rm go1.21.5.linux-amd64.tar.gz

ENV PATH="/usr/local/go/bin:${PATH}"
ENV GOPATH="/root/go"
ENV PATH="${GOPATH}/bin:${PATH}"

# ============================================================================
# C# / .NET
# ============================================================================
RUN wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb && \
    dpkg -i packages-microsoft-prod.deb && \
    rm packages-microsoft-prod.deb && \
    apt-get update && \
    apt-get install -y dotnet-sdk-8.0 && \
    rm -rf /var/lib/apt/lists/*

# ============================================================================
# ADDITIONAL TOOLS
# ============================================================================

# Install additional development tools
RUN apt-get update && apt-get install -y \
    # Database clients
    postgresql-client \
    mysql-client \
    redis-tools \
    # Version control
    git-lfs \
    # Documentation
    pandoc \
    # Testing
    valgrind \
    strace \
    && rm -rf /var/lib/apt/lists/*

# Install Docker CLI (for Docker-in-Docker scenarios)
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add - && \
    echo "deb [arch=amd64] https://download.docker.com/linux/ubuntu jammy stable" > /etc/apt/sources.list.d/docker.list && \
    apt-get update && \
    apt-get install -y docker-ce-cli && \
    rm -rf /var/lib/apt/lists/*

# ============================================================================
# NETWORKING & INTERNET ACCESS
# ============================================================================

# DNS is automatically managed by Docker
# Test internet connectivity (at build time)
RUN curl -sSf https://www.google.com > /dev/null || echo "Warning: No internet at build time"

# ============================================================================
# USER SETUP
# ============================================================================

# Create non-root user for security
RUN useradd -m -s /bin/bash -u 1000 devbox && \
    usermod -aG sudo devbox && \
    echo "devbox ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Set up workspace
RUN mkdir -p /workspace/input /workspace/output && \
    chown -R devbox:devbox /workspace

# ============================================================================
# ENTRYPOINT
# ============================================================================

# Copy entrypoint script
COPY --chown=devbox:devbox entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh && \
    dos2unix /usr/local/bin/entrypoint.sh 2>/dev/null || sed -i 's/\r$//' /usr/local/bin/entrypoint.sh

# Switch to devbox user
USER devbox
WORKDIR /workspace

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=development
ENV TERM=xterm-256color

# Entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/bin/bash"]
