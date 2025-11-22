# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔥 UBUNTU VM MCP - Docker Image for AI Development Environment
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Image de base Ubuntu avec XFCE Desktop + VNC + environnement complet IA
# Conçu pour Claude CLI, Ollama, Gemini CLI et autres agents IA
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FROM ubuntu:22.04

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🌍 Configuration de base - Locales & Timezone
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENV DEBIAN_FRONTEND=noninteractive \
    TZ=Europe/Paris \
    LANG=fr_FR.UTF-8 \
    LANGUAGE=fr_FR:fr \
    LC_ALL=fr_FR.UTF-8 \
    MCP_DIR=/opt/mcp \
    DATA_DIR=/data \
    VNC_DISPLAY=:1 \
    VNC_PORT=5900 \
    VNC_RESOLUTION=1920x1080

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📦 Installation des paquets système de base
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RUN apt-get update && apt-get install -y \
    # Locales & système de base
    locales \
    tzdata \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common \
    apt-transport-https \
    # Outils système essentiels
    sudo \
    curl \
    wget \
    git \
    vim \
    nano \
    htop \
    net-tools \
    iputils-ping \
    dnsutils \
    iproute2 \
    # Systemd & init
    systemd \
    systemd-sysv \
    dbus \
    # Outils de surveillance
    inotify-tools \
    procps \
    psmisc \
    # Compression & manipulation de fichiers
    unzip \
    zip \
    tar \
    gzip \
    bzip2 \
    # Build tools (utile pour compilation)
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Configuration des locales
RUN locale-gen fr_FR.UTF-8 && \
    update-locale LANG=fr_FR.UTF-8

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🖥️ Installation de XFCE Desktop Environment
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RUN apt-get update && apt-get install -y \
    # XFCE Desktop complet mais léger
    xfce4 \
    xfce4-goodies \
    xfce4-terminal \
    # Gestionnaire de fichiers
    thunar \
    thunar-archive-plugin \
    thunar-media-tags-plugin \
    # Utilitaires graphiques
    mousepad \
    ristretto \
    xfce4-screenshooter \
    xfce4-taskmanager \
    xfce4-notifyd \
    # Fonts pour meilleur rendu
    fonts-liberation \
    fonts-dejavu \
    fonts-noto \
    && rm -rf /var/lib/apt/lists/*

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📺 Installation de TigerVNC Server
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RUN apt-get update && apt-get install -y \
    tigervnc-standalone-server \
    tigervnc-common \
    dbus-x11 \
    x11-xserver-utils \
    xauth \
    && rm -rf /var/lib/apt/lists/*

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔐 Installation de OpenSSH Server
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RUN apt-get update && apt-get install -y \
    openssh-server \
    && mkdir -p /var/run/sshd \
    && mkdir -p /root/.ssh \
    && chmod 700 /root/.ssh \
    && rm -rf /var/lib/apt/lists/*

# Configuration SSH pour autoriser connexion root (optionnel, pour debug)
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config \
    && sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🐍 Installation de Python 3 + pip + outils développement
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    python3-setuptools \
    python3-wheel \
    && rm -rf /var/lib/apt/lists/*

# Création de liens symboliques pour python
RUN ln -sf /usr/bin/python3 /usr/bin/python && \
    ln -sf /usr/bin/pip3 /usr/bin/pip

# Mise à jour de pip
RUN pip install --upgrade pip setuptools wheel

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 👤 Création de l'utilisateur IA avec sudo sans mot de passe
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RUN useradd -m -s /bin/bash -G sudo ia && \
    echo "ia:ia" | chpasswd && \
    mkdir -p /home/ia/.vnc && \
    mkdir -p /home/ia/.config/xfce4 && \
    mkdir -p /home/ia/Bureau && \
    mkdir -p /home/ia/Documents && \
    mkdir -p /home/ia/Téléchargements

# Configuration sudo sans mot de passe pour utilisateur ia
RUN echo "ia ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/ia && \
    chmod 0440 /etc/sudoers.d/ia

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📁 Création des répertoires MCP et DATA
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RUN mkdir -p ${MCP_DIR} ${DATA_DIR} && \
    chown -R ia:ia ${MCP_DIR} ${DATA_DIR}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔧 Configuration VNC pour l'utilisateur ia
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USER ia
WORKDIR /home/ia

# Configuration du mot de passe VNC (par défaut: "vncpass")
# TODO: Permettre de définir VNC_PASSWORD via variable d'environnement
RUN mkdir -p /home/ia/.vnc && \
    echo "vncpass" | vncpasswd -f > /home/ia/.vnc/passwd && \
    chmod 600 /home/ia/.vnc/passwd

# Configuration du startup XFCE pour VNC
RUN echo '#!/bin/bash' > /home/ia/.vnc/xstartup && \
    echo 'unset SESSION_MANAGER' >> /home/ia/.vnc/xstartup && \
    echo 'unset DBUS_SESSION_BUS_ADDRESS' >> /home/ia/.vnc/xstartup && \
    echo 'exec startxfce4' >> /home/ia/.vnc/xstartup && \
    chmod +x /home/ia/.vnc/xstartup

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📋 Copie des scripts MCP dans le conteneur
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USER root

# Copie des scripts MCP
COPY --chown=ia:ia mcp/ ${MCP_DIR}/

# Rendre tous les scripts exécutables
RUN chmod +x ${MCP_DIR}/*.sh 2>/dev/null || true

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎯 Installation d'outils IA de base (optionnel, via install.sh)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Installation de Node.js (utile pour certains outils IA et MCP)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Installation de jq (utile pour manipulation JSON dans scripts)
RUN apt-get update && apt-get install -y jq && \
    rm -rf /var/lib/apt/lists/*

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 Configuration du point d'entrée et services
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Script d'entrypoint
COPY --chmod=755 <<'EOF' /entrypoint.sh
#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 Ubuntu VM MCP - Environnement IA Starting..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Démarrage de SSH (optionnel)
echo "🔐 Starting SSH server..."
sudo service ssh start || echo "⚠️  SSH failed to start (non-critical)"

# Nettoyage des anciens processus VNC
echo "🧹 Cleaning old VNC processes..."
rm -rf /tmp/.X1-lock /tmp/.X11-unix/X1 2>/dev/null || true

# Démarrage du serveur VNC en tant qu'utilisateur ia
echo "📺 Starting VNC server on display ${VNC_DISPLAY}..."
su - ia -c "vncserver ${VNC_DISPLAY} -geometry ${VNC_RESOLUTION} -localhost no"

# Vérification du démarrage
sleep 2
if pgrep -u ia Xvnc > /dev/null; then
    echo "✅ VNC Server started successfully on port ${VNC_PORT}"
    echo "   Connect with: vncviewer localhost:${VNC_PORT}"
    echo "   Password: vncpass (default)"
else
    echo "❌ VNC Server failed to start"
    exit 1
fi

# Informations réseau
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌍 Network Information:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ip addr show | grep "inet " | grep -v "127.0.0.1"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 MCP Directory: ${MCP_DIR}"
echo "📁 Data Directory: ${DATA_DIR}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Exécution du script de démarrage MCP si disponible
if [ -f "${MCP_DIR}/start.sh" ]; then
    echo "🚀 Running MCP start script..."
    su - ia -c "bash ${MCP_DIR}/start.sh" || echo "⚠️  MCP start script failed (non-critical)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Ubuntu VM MCP ready! Environment started successfully."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Garder le conteneur actif
tail -f /dev/null
EOF

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🔌 Exposition des ports
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXPOSE ${VNC_PORT} 22 8080

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🎬 Point d'entrée final
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENTRYPOINT ["/entrypoint.sh"]

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📝 Métadonnées
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LABEL maintainer="Claude AI" \
      description="Ubuntu VM MCP - Full AI Development Environment with XFCE + VNC" \
      version="1.0.0"
