# ============================================================================
# MCP KALI LINUX - Environnement Kali Dockerisé pour IA de Cybersécurité
# ============================================================================
# Image de base : Kali Linux Rolling (dernière version officielle)
# Utilisation : Environnement isolé pour pentest autorisé, CTF, recherche
# Pilotage : IA (Claude CLI, ChatGPT CLI, Gemini CLI, etc.)
# ============================================================================

FROM kalilinux/kali-rolling

# Métadonnées de l'image
LABEL maintainer="AI Security Lab"
LABEL description="Kali Linux MCP environment for AI-driven security testing"
LABEL version="1.0"

# Variables d'environnement
ENV DEBIAN_FRONTEND=noninteractive
ENV USER=ia
ENV HOME=/home/ia
ENV MCP_DIR=/mcp
ENV LOGS_DIR=/logs
ENV AI_CONTEXT_DIR=/ai_context

# ============================================================================
# MISE À JOUR DU SYSTÈME
# ============================================================================
RUN apt-get update && \
    apt-get full-upgrade -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# ============================================================================
# INSTALLATION DES OUTILS DE BASE
# ============================================================================
RUN apt-get update && apt-get install -y \
    # Outils système essentiels
    sudo \
    curl \
    wget \
    git \
    nano \
    vim \
    htop \
    tmux \
    screen \
    net-tools \
    iproute2 \
    iputils-ping \
    dnsutils \
    netcat-traditional \
    openssh-server \
    # Outils de développement
    build-essential \
    python3 \
    python3-pip \
    python3-venv \
    golang \
    nodejs \
    npm \
    # Outils de monitoring
    procps \
    psmisc \
    lsof \
    strace \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ============================================================================
# INSTALLATION DES OUTILS DE RÉSEAU ET RECONNAISSANCE
# ============================================================================
RUN apt-get update && apt-get install -y \
    nmap \
    masscan \
    rustscan \
    netdiscover \
    arp-scan \
    tcpdump \
    wireshark-common \
    tshark \
    ettercap-common \
    dsniff \
    ngrep \
    hping3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ============================================================================
# INSTALLATION DES OUTILS DE PENTEST WEB
# ============================================================================
RUN apt-get update && apt-get install -y \
    nikto \
    dirb \
    dirbuster \
    gobuster \
    wfuzz \
    ffuf \
    sqlmap \
    wpscan \
    nuclei \
    subfinder \
    httpx-toolkit \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ============================================================================
# INSTALLATION DES OUTILS D'EXPLOITATION
# ============================================================================
# TODO: Metasploit peut être volumineux, décommenter si nécessaire
# RUN apt-get update && apt-get install -y \
#     metasploit-framework \
#     && apt-get clean \
#     && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y \
    exploitdb \
    hydra \
    medusa \
    john \
    hashcat \
    crunch \
    cewl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ============================================================================
# INSTALLATION DES OUTILS D'ANALYSE ET FORENSICS
# ============================================================================
RUN apt-get update && apt-get install -y \
    binwalk \
    foremost \
    exiftool \
    strings \
    hexedit \
    xxd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ============================================================================
# INSTALLATION DE TTYD (Terminal Web pour accès IA)
# ============================================================================
RUN apt-get update && apt-get install -y \
    ttyd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ============================================================================
# INSTALLATION D'OUTILS PYTHON POUR L'IA
# ============================================================================
RUN pip3 install --no-cache-dir \
    requests \
    beautifulsoup4 \
    scrapy \
    scapy \
    impacket \
    pwntools \
    python-nmap \
    shodan \
    censys

# ============================================================================
# CONFIGURATION SSH (optionnel)
# ============================================================================
RUN mkdir /var/run/sshd && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config && \
    echo "AllowUsers ia" >> /etc/ssh/sshd_config

# ============================================================================
# CRÉATION DE L'UTILISATEUR IA
# ============================================================================
RUN useradd -m -s /bin/bash -G sudo ${USER} && \
    # Pas de mot de passe (accès par SSH key ou docker exec uniquement)
    passwd -d ${USER}

# Configuration sudo sans mot de passe pour l'utilisateur IA
RUN echo "${USER} ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/${USER} && \
    chmod 0440 /etc/sudoers.d/${USER}

# ============================================================================
# CRÉATION DES DOSSIERS DE TRAVAIL
# ============================================================================
RUN mkdir -p ${MCP_DIR} ${LOGS_DIR} ${AI_CONTEXT_DIR} && \
    chown -R ${USER}:${USER} ${MCP_DIR} ${LOGS_DIR} ${AI_CONTEXT_DIR}

# ============================================================================
# COPIE DES SCRIPTS MCP
# ============================================================================
COPY --chown=${USER}:${USER} scripts/ ${MCP_DIR}/
RUN chmod +x ${MCP_DIR}/*.sh

# ============================================================================
# CONFIGURATION DE L'ENVIRONNEMENT UTILISATEUR
# ============================================================================
USER ${USER}
WORKDIR ${HOME}

# Configuration du shell
RUN echo 'export PS1="[\u@\h \W]\\$ "' >> ${HOME}/.bashrc && \
    echo 'alias ll="ls -lah"' >> ${HOME}/.bashrc && \
    echo 'alias scan="nmap -sV -sC"' >> ${HOME}/.bashrc && \
    echo 'export PATH=$PATH:/mcp' >> ${HOME}/.bashrc

# ============================================================================
# EXPOSITION DES PORTS
# ============================================================================
# Port 22 : SSH (optionnel, à activer avec précaution)
# Port 7681 : ttyd (terminal web)
EXPOSE 22 7681

# ============================================================================
# VOLUMES RECOMMANDÉS
# ============================================================================
# /logs : pour persister les logs de sessions
# /ai_context : pour les missions et rapports
# /home/ia/workspace : pour les données de travail
VOLUME ["/logs", "/ai_context", "/home/ia/workspace"]

# ============================================================================
# HEALTHCHECK
# ============================================================================
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD pidof ttyd || exit 1

# ============================================================================
# POINT D'ENTRÉE
# ============================================================================
# TODO: Adapter selon le mode d'utilisation (SSH, ttyd, ou les deux)
USER root
ENTRYPOINT ["/mcp/startup.sh"]

# Commande par défaut : garder le conteneur actif
CMD ["tail", "-f", "/dev/null"]

# ============================================================================
# NOTES DE SÉCURITÉ
# ============================================================================
# ⚠️  ATTENTION : Cet environnement contient des outils de pentest puissants
# ⚠️  À utiliser UNIQUEMENT dans un cadre légal et autorisé
# ⚠️  Ne JAMAIS exposer directement sur Internet sans durcissement
# ⚠️  Réseau bridge isolé recommandé
# ⚠️  Mode --privileged à éviter sauf nécessité absolue (docker, pcap, etc.)
# ============================================================================
