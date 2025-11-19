# Claude DevBox Sandbox - Multi-language Development Environment
# Base: Debian Slim with Internet Access

FROM debian:bookworm-slim

LABEL maintainer="Skynet Coalition <skynet.coalition@gmail.com>"
LABEL description="Claude DevBox Sandbox - Secure multi-language execution environment"
LABEL version="1.0.0"

# Prevent interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# Update and install base dependencies
RUN apt-get update && apt-get install -y \
    # System utilities
    curl \
    wget \
    git \
    vim \
    nano \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common \
    # Build essentials
    build-essential \
    gcc \
    g++ \
    make \
    cmake \
    pkg-config \
    # Network tools
    net-tools \
    iputils-ping \
    dnsutils \
    # Archive tools
    zip \
    unzip \
    tar \
    gzip \
    && rm -rf /var/lib/apt/lists/*

# ============= PYTHON =============
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    python3-venv \
    python3-setuptools \
    python3-wheel \
    && rm -rf /var/lib/apt/lists/*

# Create and activate Python virtual environment, then install common Python packages
RUN python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip setuptools wheel && \
    /opt/venv/bin/pip install --no-cache-dir \
        pytest \
        requests \
        numpy \
        pandas \
        flask \
        fastapi \
        uvicorn \
        black \
        pylint \
        mypy

# Set PATH to use virtual environment by default
ENV PATH="/opt/venv/bin:${PATH}"

# Create symlinks for python and pip to point to the virtual environment
RUN ln -sf /opt/venv/bin/python /usr/bin/python && \
    ln -sf /opt/venv/bin/pip /usr/bin/pip

# ============= NODE.JS =============
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install global Node packages
RUN npm install -g \
    npm@latest \
    yarn \
    pnpm \
    typescript \
    ts-node \
    @types/node \
    eslint \
    prettier \
    jest \
    nodemon

# ============= RUST =============
ENV RUSTUP_HOME=/opt/rust
ENV CARGO_HOME=/opt/rust
ENV PATH="/opt/rust/bin:${PATH}"

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable && \
    chmod -R a+rwX /opt/rust

# Install Rust tooling
RUN /opt/rust/bin/cargo install cargo-edit cargo-watch

# ============= GO =============
RUN wget -q https://go.dev/dl/go1.21.6.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz && \
    rm go1.21.6.linux-amd64.tar.gz

ENV PATH="/usr/local/go/bin:${PATH}"
ENV GOPATH="/opt/go"
ENV PATH="${GOPATH}/bin:${PATH}"

# ============= JAVA =============
RUN apt-get update && apt-get install -y \
    default-jdk \
    default-jre \
    maven \
    && rm -rf /var/lib/apt/lists/*

# ============= .NET =============
RUN wget https://packages.microsoft.com/config/debian/12/packages-microsoft-prod.deb -O packages-microsoft-prod.deb && \
    dpkg -i packages-microsoft-prod.deb && \
    rm packages-microsoft-prod.deb && \
    apt-get update && \
    apt-get install -y dotnet-sdk-8.0 && \
    rm -rf /var/lib/apt/lists/*

# ============= RUBY =============
RUN apt-get update && apt-get install -y \
    ruby \
    ruby-dev \
    && rm -rf /var/lib/apt/lists/*

RUN gem install bundler rake rspec

# ============= PHP =============
RUN apt-get update && apt-get install -y \
    php \
    php-cli \
    php-common \
    php-curl \
    php-json \
    php-mbstring \
    composer \
    && rm -rf /var/lib/apt/lists/*

# ============= Additional Tools =============
RUN apt-get update && apt-get install -y \
    # Database clients
    postgresql-client \
    mysql-client \
    sqlite3 \
    # Redis
    redis-tools \
    # Monitoring
    htop \
    strace \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user 'devbox'
RUN useradd -m -s /bin/bash -u 1000 devbox && \
    passwd -l devbox && \
    usermod -aG sudo devbox || true

# Create workspace directory
RUN mkdir -p /workspace/input /workspace/output && \
    chown -R devbox:devbox /workspace

# Grant permissions to Rust and Go directories
RUN mkdir -p ${GOPATH} && \
    chown -R devbox:devbox ${GOPATH} && \
    chown -R devbox:devbox ${CARGO_HOME}

# Set working directory
WORKDIR /workspace

# Switch to non-root user
USER devbox

# Verify installations
RUN python --version && \
    node --version && \
    npm --version && \
    rustc --version && \
    cargo --version && \
    go version && \
    java -version && \
    dotnet --version && \
    ruby --version && \
    php --version

# Copy entrypoint script
COPY --chown=devbox:devbox entrypoint.sh /usr/local/bin/entrypoint.sh
USER root
RUN chmod +x /usr/local/bin/entrypoint.sh
USER devbox

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/bin/bash"]
