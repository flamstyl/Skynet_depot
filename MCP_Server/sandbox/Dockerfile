# 🐳 Dockerfile pour Sandbox IA
# Environnement isolé et sécurisé pour exécution de code

FROM python:3.12-slim

# Informations de base
LABEL maintainer="Skynet MCP Server"
LABEL description="Sandbox isolé pour exécution de code IA"

# Installation des outils de base
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    curl \
    wget \
    git \
    vim \
    nano \
    # Langages de programmation
    nodejs \
    npm \
    # Outils système
    procps \
    htop \
    && rm -rf /var/lib/apt/lists/*

# Installation de packages Python populaires
RUN pip install --no-cache-dir \
    requests \
    numpy \
    pandas \
    matplotlib \
    # Ajoutez d'autres packages selon vos besoins

# Créer un utilisateur non-root pour la sécurité
RUN useradd -m -s /bin/bash sandbox && \
    mkdir -p /home/sandbox/workspace && \
    chown -R sandbox:sandbox /home/sandbox

# Définir le répertoire de travail
WORKDIR /home/sandbox/workspace

# Passer à l'utilisateur sandbox
USER sandbox

# Variables d'environnement
ENV PYTHONUNBUFFERED=1
ENV HOME=/home/sandbox

# Point d'entrée par défaut
CMD ["/bin/bash"]
