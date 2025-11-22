# 🔥 Ubuntu VM MCP - Environnement Docker IA Complet

[![Docker](https://img.shields.io/badge/Docker-Enabled-blue?logo=docker)](https://www.docker.com/)
[![Ubuntu](https://img.shields.io/badge/Ubuntu-22.04-orange?logo=ubuntu)](https://ubuntu.com/)
[![XFCE](https://img.shields.io/badge/Desktop-XFCE-blue)](https://xfce.org/)
[![VNC](https://img.shields.io/badge/Access-VNC-green)](https://tigervnc.org/)
[![Python](https://img.shields.io/badge/Python-3.10-yellow?logo=python)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📋 Table des matières

- [Vue d'ensemble](#-vue-densemble)
- [Caractéristiques](#-caractéristiques)
- [Prérequis](#-prérequis)
- [Installation rapide](#-installation-rapide)
- [Architecture](#-architecture)
- [Utilisation](#-utilisation)
- [Configuration](#-configuration)
- [Scripts MCP](#-scripts-mcp)
- [Agents IA disponibles](#-agents-ia-disponibles)
- [Accès et connexion](#-accès-et-connexion)
- [Administration](#-administration)
- [Cas d'usage](#-cas-dusage)
- [Troubleshooting](#-troubleshooting)
- [TODO & Roadmap](#-todo--roadmap)
- [Contribution](#-contribution)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎯 Vue d'ensemble

**Ubuntu VM MCP** est un environnement Docker complet qui fournit une **machine virtuelle Ubuntu Desktop** avec interface graphique XFCE, spécialement conçue pour exécuter et gérer des **agents IA** (Claude CLI, Ollama, Gemini CLI, etc.) dans un environnement isolé, sécurisé et reproductible.

### 🎬 Concept

Imaginez avoir un **véritable ordinateur Linux** dans un conteneur Docker, avec:
- Une interface graphique complète (XFCE)
- Un accès VNC pour contrôle distant
- Un utilisateur dédié avec droits root
- Un réseau complet avec accès Internet
- Des outils de développement pré-installés
- Un système de scripts MCP pour automatisation
- Des agents IA prêts à l'emploi

C'est exactement ce que propose **Ubuntu VM MCP** ! 🚀

### 🌟 Pourquoi Ubuntu VM MCP ?

#### Pour les développeurs IA
- Environnement isolé pour tester des agents IA
- Pas de pollution de votre système hôte
- Reproductible sur n'importe quelle machine
- Snapshots et backups faciles

#### Pour l'administration système
- Gestion de serveurs via Docker dans un environnement GUI
- Tests de scripts d'administration
- Formation et sandbox sécurisé
- Automatisation avec MCP

#### Pour le graphisme et le multimédia
- Outils graphiques pré-installés (GIMP, Inkscape)
- Traitement vidéo (FFmpeg)
- Génération de contenu avec IA
- Workflows automatisés

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ✨ Caractéristiques

### 🖥️ Système d'exploitation

- **Base:** Ubuntu 22.04 LTS
- **Desktop:** XFCE (léger et performant)
- **Init:** systemd (services système complets)
- **Locales:** Français (fr_FR.UTF-8)
- **Timezone:** Europe/Paris

### 📺 Interface graphique

- **VNC Server:** TigerVNC
- **Résolution:** 1920x1080 (configurable)
- **Display:** `:1` (port 5900)
- **Mot de passe VNC:** `vncpass` (par défaut)

### 🔐 Accès et sécurité

- **Utilisateur principal:** `ia` (mot de passe: `ia`)
- **Privilèges:** sudo sans mot de passe
- **SSH:** Port 2222
- **Isolation:** Conteneur Docker
- **Réseau:** Bridge avec accès Internet complet

### 🐍 Environnement de développement

#### Langages et runtimes
- Python 3.10+ avec pip
- Node.js 20.x avec npm
- Bash scripting
- Build tools (gcc, make, etc.)

#### Outils IA
- **Claude CLI** (Anthropic)
- **Ollama** (LLMs locaux)
- **Gemini CLI** (Google)
- SDK Python: `anthropic`, `openai`, `google-generativeai`

#### Outils système
- Git, curl, wget
- Docker CLI
- htop, vim, nano
- jq (JSON processing)
- inotify-tools (file watching)

#### Outils graphiques
- GIMP (édition d'images)
- Inkscape (graphiques vectoriels)
- ImageMagick (traitement d'images en batch)
- FFmpeg (vidéo/audio)
- Graphviz (graphes et diagrammes)

### 📁 Structure de volumes

```
ubuntu_vm_mcp/
├── data/          # Volume persistant (/data dans le conteneur)
└── mcp/           # Scripts MCP (/opt/mcp dans le conteneur)
    ├── install.sh
    ├── watcher.sh
    ├── start.sh
    ├── start-agent.sh
    └── README_mcp.md
```

### 🔌 Ports exposés

| Port | Service | Description |
|------|---------|-------------|
| 5900 | VNC | Interface graphique XFCE |
| 2222 | SSH | Accès terminal |
| 8080 | HTTP | Service IA / API local |
| 3000 | HTTP | Dev server (optionnel) |
| 8888 | HTTP | Jupyter / autres services |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📋 Prérequis

### Système hôte

- **OS:** Linux, macOS, ou Windows avec WSL2
- **Docker:** Version 20.10 ou supérieure
- **Docker Compose:** Version 2.0 ou supérieure
- **RAM:** 4 GB minimum (8 GB recommandé)
- **CPU:** 2 cores minimum (4 cores recommandé)
- **Stockage:** 10 GB minimum d'espace libre

### Client VNC (pour l'accès graphique)

Choisissez un client VNC selon votre OS:

- **Linux:**
  - TigerVNC Viewer: `sudo apt install tigervnc-viewer`
  - Remmina: `sudo apt install remmina`

- **macOS:**
  - VNC Viewer (built-in)
  - RealVNC: https://www.realvnc.com/

- **Windows:**
  - TightVNC: https://www.tightvnc.com/
  - RealVNC: https://www.realvnc.com/
  - UltraVNC: https://www.uvnc.com/

### Vérification des prérequis

```bash
# Vérifier Docker
docker --version
# Sortie attendue: Docker version 20.10.x ou supérieur

# Vérifier Docker Compose
docker compose version
# Sortie attendue: Docker Compose version 2.x.x ou supérieur

# Vérifier que Docker daemon tourne
docker info
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🚀 Installation rapide

### Étape 1: Cloner le projet

```bash
git clone <votre-repo>
cd ubuntu_vm_mcp
```

### Étape 2: Lancer l'environnement

```bash
./launch_vm.sh
```

C'est tout ! Le script `launch_vm.sh` va:
1. ✅ Vérifier que Docker est installé
2. 🏗️ Builder l'image Docker
3. 🚀 Lancer le conteneur
4. ⏳ Attendre le démarrage complet
5. 📊 Afficher les informations de connexion

### Étape 3: Se connecter en VNC

```bash
# Linux / macOS
vncviewer localhost:5900

# Windows: utilisez votre client VNC avec:
# - Host: localhost:5900
# - Password: vncpass
```

### Étape 4: Configuration initiale (dans la VM)

Une fois connecté en VNC, ouvrez un terminal XFCE et exécutez:

```bash
# 1. Installer les outils IA
bash /opt/mcp/install.sh

# 2. Configurer vos clés API
nano ~/.ai_env
# Modifier avec vos vraies clés API

# 3. Charger l'environnement
source ~/.ai_env

# 4. Tester
claude-test
ollama list
```

🎉 **Vous êtes prêt !** Votre environnement IA est opérationnel.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🏗️ Architecture

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                      SYSTÈME HÔTE                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              CONTENEUR DOCKER                        │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │         Ubuntu 22.04 + XFCE Desktop          │  │   │
│  │  │                                                │  │   │
│  │  │  ┌──────────────┐      ┌──────────────────┐  │  │   │
│  │  │  │  VNC Server  │      │  SSH Server      │  │  │   │
│  │  │  │  Port 5900   │      │  Port 22         │  │  │   │
│  │  │  └──────────────┘      └──────────────────┘  │  │   │
│  │  │                                                │  │   │
│  │  │  ┌──────────────────────────────────────────┐ │  │   │
│  │  │  │       Agents IA                          │ │  │   │
│  │  │  │  • Claude CLI                            │ │  │   │
│  │  │  │  • Ollama                                │ │  │   │
│  │  │  │  • Gemini CLI                            │ │  │   │
│  │  │  └──────────────────────────────────────────┘ │  │   │
│  │  │                                                │  │   │
│  │  │  ┌──────────────┐      ┌──────────────────┐  │  │   │
│  │  │  │  /opt/mcp/   │      │     /data/       │  │  │   │
│  │  │  │  Scripts MCP │      │  Volume données  │  │  │   │
│  │  │  └──────────────┘      └──────────────────┘  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  Ports mappés:                                               │
│  • 5900:5900 (VNC)                                           │
│  • 2222:22   (SSH)                                           │
│  • 8080:8080 (HTTP)                                          │
└─────────────────────────────────────────────────────────────┘
```

### Flux de données

```
Utilisateur
    │
    ├─► VNC (port 5900) ──► XFCE Desktop ──► Applications graphiques
    │
    ├─► SSH (port 2222) ──► Terminal bash ──► Scripts MCP
    │
    └─► HTTP (port 8080) ──► Services web locaux
```

### Composants principaux

1. **Dockerfile**: Définit l'image Ubuntu avec tous les outils
2. **docker-compose.yml**: Orchestre le conteneur, volumes et réseau
3. **launch_vm.sh**: Script de lancement user-friendly
4. **Scripts MCP** (`/opt/mcp/`): Automatisation et gestion IA
5. **Volume data** (`/data/`): Stockage persistant

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 💻 Utilisation

### Démarrage et arrêt

```bash
# Démarrer l'environnement
./launch_vm.sh

# Arrêter le conteneur
docker compose stop

# Redémarrer
docker compose restart

# Arrêter et supprimer le conteneur (données préservées)
docker compose down

# Rebuild complet
./launch_vm.sh --rebuild

# Rebuild sans cache
./launch_vm.sh --rebuild --no-cache
```

### Accès shell (CLI)

```bash
# Accès bash en tant qu'utilisateur ia
docker compose exec ubuntu_vm_mcp bash

# Accès en tant que root
docker compose exec -u root ubuntu_vm_mcp bash

# Via SSH depuis l'hôte
ssh ia@localhost -p 2222
# Mot de passe: ia
```

### Consultation des logs

```bash
# Logs en temps réel
docker compose logs -f

# Logs du conteneur uniquement
docker compose logs ubuntu_vm_mcp

# Dernières 100 lignes
docker compose logs --tail=100
```

### Gestion des services IA

```bash
# Lancer le menu d'agents IA
docker compose exec ubuntu_vm_mcp bash /opt/mcp/start-agent.sh

# Lancer directement un agent
docker compose exec -u ia ubuntu_vm_mcp bash -c "source ~/.ai_env && ollama run llama2"
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ⚙️ Configuration

### Variables d'environnement

Modifiez `docker-compose.yml` pour personnaliser:

```yaml
environment:
  # Résolution VNC
  - VNC_RESOLUTION=1920x1080  # Changer selon votre écran

  # Timezone
  - TZ=Europe/Paris

  # Clés API (optionnel, mieux dans ~/.ai_env)
  - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
  - OPENAI_API_KEY=${OPENAI_API_KEY}
  - GEMINI_API_KEY=${GEMINI_API_KEY}
```

### Mot de passe VNC

Par défaut: `vncpass`

Pour changer (modifier le Dockerfile):

```dockerfile
RUN echo "votre-nouveau-mot-de-passe" | vncpasswd -f > /home/ia/.vnc/passwd && \
    chmod 600 /home/ia/.vnc/passwd
```

### Partage de répertoires

Ajoutez des volumes dans `docker-compose.yml`:

```yaml
volumes:
  - ./data:/data:rw
  - ./mcp:/opt/mcp:rw

  # Partager votre code depuis l'hôte
  - ~/mes-projets:/home/ia/projets:rw

  # Persister le home de l'utilisateur ia
  - ./home_ia:/home/ia:rw
```

### Ressources allouées

Limitez CPU et RAM dans `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '4'      # Maximum 4 CPU cores
      memory: 8G     # Maximum 8GB RAM
    reservations:
      cpus: '2'      # Minimum 2 cores
      memory: 4G     # Minimum 4GB
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📜 Scripts MCP

Le répertoire `/opt/mcp/` contient des scripts d'orchestration. Consultez [`mcp/README_mcp.md`](mcp/README_mcp.md) pour la documentation détaillée.

### 🔧 `install.sh`

Installe tous les outils IA et dépendances.

```bash
bash /opt/mcp/install.sh
```

**Installe:**
- Python packages (anthropic, openai, google-generativeai)
- Claude CLI (wrapper)
- Ollama
- Gemini CLI
- Outils graphiques (GIMP, Inkscape, etc.)
- Docker CLI

### 👁️ `watcher.sh`

Surveille les changements de fichiers dans `/opt/mcp/` et `/data/`.

```bash
# Lancement en avant-plan
bash /opt/mcp/watcher.sh

# En arrière-plan
bash /opt/mcp/watcher.sh &
```

**Événements détectés:**
- Création de fichiers
- Modification
- Suppression
- Déplacement

### 🚀 `start.sh`

Script de démarrage automatique (appelé au boot).

```bash
bash /opt/mcp/start.sh
```

**Actions:**
- Charge l'environnement (`~/.ai_env`)
- Vérifie les répertoires
- Démarre Ollama
- Affiche les instructions

### 🤖 `start-agent.sh`

Menu interactif pour lancer des agents IA.

```bash
bash /opt/mcp/start-agent.sh
```

**Agents disponibles:**
1. Claude CLI
2. Ollama
3. Gemini CLI
4. Mode Python interactif
5. Tous les services

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🤖 Agents IA disponibles

### Claude CLI (Anthropic)

**Configuration:**
```bash
export ANTHROPIC_API_KEY="sk-ant-votre-clé"
```

**Utilisation:**
```bash
# Via le menu
bash /opt/mcp/start-agent.sh
# Choisir option 1

# Direct en Python
python3 << EOF
from anthropic import Anthropic
client = Anthropic()
message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello!"}]
)
print(message.content[0].text)
EOF
```

### Ollama (LLMs locaux)

**Installation de modèles:**
```bash
ollama pull llama2
ollama pull mistral
ollama pull codellama
ollama pull llava  # Vision
```

**Utilisation:**
```bash
# Interactif
ollama run llama2

# One-shot
echo "Résume ce texte: ..." | ollama run llama2
```

**Liste des modèles disponibles:**
```bash
ollama list
```

### Gemini CLI (Google)

**Configuration:**
```bash
export GEMINI_API_KEY="votre-clé-gemini"
```

**Utilisation:**
```bash
# Via wrapper
gemini-cli "Explique le MCP"

# Python
python3 << EOF
import google.generativeai as genai
genai.configure(api_key="votre-clé")
model = genai.GenerativeModel('gemini-pro')
response = model.generate_content("Hello")
print(response.text)
EOF
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔌 Accès et connexion

### VNC (Interface graphique)

**Connexion:**
```bash
# Linux
vncviewer localhost:5900

# macOS (built-in VNC)
open vnc://localhost:5900

# Windows: utilisez TightVNC, RealVNC, etc.
# Host: localhost:5900
# Password: vncpass
```

**Clients VNC recommandés:**
- **TigerVNC Viewer** (Linux/Windows/macOS)
- **Remmina** (Linux, excellent client avec plein de fonctionnalités)
- **RealVNC Viewer** (Cross-platform, interface moderne)

### SSH (Terminal)

**Connexion:**
```bash
ssh ia@localhost -p 2222
# Mot de passe: ia
```

**Copie de fichiers via SCP:**
```bash
# Hôte → Conteneur
scp -P 2222 fichier.txt ia@localhost:/data/

# Conteneur → Hôte
scp -P 2222 ia@localhost:/data/fichier.txt ./
```

**Clés SSH (optionnel):**
```bash
# Générer une clé sur l'hôte
ssh-keygen -t ed25519

# Copier dans le conteneur
ssh-copy-id -p 2222 ia@localhost
```

### HTTP (Services web)

**Accéder aux services:**
- http://localhost:8080 - Service principal
- http://localhost:3000 - Dev server
- http://localhost:8888 - Jupyter / autres

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🛠️ Administration

### Gestion des processus

```bash
# Dans le conteneur
docker compose exec ubuntu_vm_mcp bash

# Liste des processus
ps aux

# Processus de l'utilisateur ia
ps aux | grep ia

# Vérifier VNC
pgrep -u ia Xvnc

# Vérifier Ollama
pgrep ollama
```

### Gestion du stockage

```bash
# Taille du conteneur
docker system df

# Espace utilisé par le volume data
du -sh ./data

# Nettoyage Docker
docker system prune -a
```

### Backup et restore

**Backup du volume data:**
```bash
# Créer une archive
tar -czf backup-data-$(date +%Y%m%d).tar.gz ./data/

# Ou utiliser rsync
rsync -av ./data/ /chemin/backup/
```

**Backup complet (conteneur + volumes):**
```bash
# Exporter le conteneur
docker export ubuntu_vm_mcp > ubuntu_vm_mcp_backup.tar

# Sauvegarder les volumes
tar -czf volumes_backup.tar.gz ./data ./mcp
```

**Restore:**
```bash
# Restaurer le volume data
tar -xzf backup-data-20241122.tar.gz
```

### Mise à jour de l'image

```bash
# Rebuild complet
./launch_vm.sh --rebuild

# Ou manuellement
docker compose build --no-cache
docker compose up -d --force-recreate
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎯 Cas d'usage

### 1. Développement d'agents IA

**Scénario:** Tester un agent Claude qui analyse du code Python.

```bash
# 1. Accéder au conteneur
docker compose exec ubuntu_vm_mcp bash

# 2. Créer un script d'agent
cat > /data/analyze_code.py << 'EOF'
from anthropic import Anthropic
import os, sys

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

code_file = sys.argv[1]
with open(code_file, 'r') as f:
    code = f.read()

message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=2048,
    messages=[{
        "role": "user",
        "content": f"Analyse ce code Python et suggère des améliorations:\n\n{code}"
    }]
)

print(message.content[0].text)
EOF

# 3. Utiliser l'agent
python3 /data/analyze_code.py /data/mon_script.py
```

### 2. Administration système avec Docker

**Scénario:** Gérer des conteneurs Docker depuis la VM.

```bash
# Docker est installé dans la VM
docker ps
docker images

# Lancer un container nginx
docker run -d -p 8081:80 nginx

# Accessible depuis l'hôte sur http://localhost:8081
```

### 3. Graphisme avec IA

**Scénario:** Générer et éditer des images.

```bash
# 1. Générer une image avec IA (via API)
# 2. Éditer avec GIMP en GUI (via VNC)

# Ou automatiser avec ImageMagick
convert -size 800x600 xc:white -font Arial -pointsize 40 \
        -draw "text 100,300 'Generated by AI'" output.png
```

### 4. Surveillance automatique avec watcher

**Scénario:** Analyser automatiquement les nouveaux fichiers.

```bash
# Modifier watcher.sh pour ajouter:
if [[ "$file" == *.py ]]; then
    python3 /data/analyze_code.py "$file" > "${file}.analysis"
fi

# Lancer le watcher
bash /opt/mcp/watcher.sh &

# Chaque nouveau fichier .py sera analysé automatiquement
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🐛 Troubleshooting

### VNC ne démarre pas

**Symptôme:** Impossible de se connecter via VNC.

**Solutions:**
```bash
# 1. Vérifier que le serveur VNC tourne
docker compose exec ubuntu_vm_mcp pgrep -u ia Xvnc

# 2. Consulter les logs
docker compose logs | grep -i vnc

# 3. Redémarrer VNC manuellement
docker compose exec -u ia ubuntu_vm_mcp bash
vncserver -kill :1
vncserver :1 -geometry 1920x1080 -localhost no
```

### Ollama ne démarre pas

**Symptôme:** `ollama: command not found`

**Solutions:**
```bash
# 1. Vérifier l'installation
docker compose exec ubuntu_vm_mcp which ollama

# 2. Réinstaller
docker compose exec ubuntu_vm_mcp bash /opt/mcp/install.sh

# 3. Démarrer manuellement
docker compose exec ubuntu_vm_mcp ollama serve &
```

### Problèmes de réseau

**Symptôme:** Pas d'accès Internet depuis le conteneur.

**Solutions:**
```bash
# 1. Tester la connectivité
docker compose exec ubuntu_vm_mcp ping -c 3 8.8.8.8

# 2. Tester DNS
docker compose exec ubuntu_vm_mcp ping -c 3 google.com

# 3. Vérifier la configuration réseau
docker compose exec ubuntu_vm_mcp ip addr show
docker network inspect bridge
```

### Clés API non reconnues

**Symptôme:** Erreurs "API key not found".

**Solutions:**
```bash
# 1. Vérifier que .ai_env est chargé
docker compose exec -u ia ubuntu_vm_mcp bash -c "source ~/.ai_env && echo \$ANTHROPIC_API_KEY"

# 2. Vérifier le contenu
docker compose exec ubuntu_vm_mcp cat /home/ia/.ai_env

# 3. Éditer et corriger
docker compose exec -u ia ubuntu_vm_mcp nano ~/.ai_env
```

### Performances lentes

**Solutions:**
1. Allouer plus de ressources dans `docker-compose.yml`
2. Réduire la résolution VNC: `VNC_RESOLUTION=1280x720`
3. Utiliser mode headless (SSH only, sans GUI)
4. Nettoyer Docker: `docker system prune -a`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📝 TODO & Roadmap

### 🚧 Fonctionnalités à venir

#### High Priority
- [ ] **noVNC**: Accès GUI via navigateur web (pas besoin de client VNC)
- [ ] **GPU Support**: Intégration CUDA pour modèles IA locaux
- [ ] **Service systemd**: Pour watcher et agents IA
- [ ] **Snapshots automatiques**: Backup automatique de `/data/`
- [ ] **Interface web de contrôle**: Dashboard pour gérer les agents

#### Medium Priority
- [ ] **Mode headless**: Variante sans GUI (plus léger)
- [ ] **Multi-containers**: Support pour plusieurs agents IA en parallèle
- [ ] **Intégration n8n**: Workflows d'automatisation visuels
- [ ] **Base de données**: PostgreSQL/MongoDB pré-configuré
- [ ] **Jupyter Notebook**: Pré-installé et configuré
- [ ] **VS Code Server**: Code editing via web

#### Low Priority
- [ ] **Templates de projets**: Starters pour différents use cases
- [ ] **Monitoring**: Prometheus + Grafana
- [ ] **Logs centralisés**: ELK stack (Elasticsearch, Logstash, Kibana)
- [ ] **CI/CD**: Intégration GitLab CI / GitHub Actions
- [ ] **Kubernetes**: Déploiement via Helm chart

### 🔧 Améliorations techniques

- [ ] Optimisation de la taille de l'image Docker
- [ ] Multi-stage build pour réduire les layers
- [ ] Healthchecks plus robustes
- [ ] Support ARM64 (Apple Silicon)
- [ ] Documentation vidéo / GIFs
- [ ] Tests automatisés

### 💡 Idées d'extensions

- [ ] Support pour d'autres LLMs (Mistral, Cohere, etc.)
- [ ] Intégration avec vector databases (Pinecone, Weaviate)
- [ ] Agent orchestration (LangChain, AutoGPT)
- [ ] Web scraping tools intégrés
- [ ] OCR et traitement de documents
- [ ] Speech-to-text / Text-to-speech

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment participer:

### Rapporter un bug

Ouvrez une issue avec:
- Description du problème
- Steps to reproduce
- Logs pertinents
- Environnement (OS, Docker version, etc.)

### Proposer une fonctionnalité

1. Vérifiez qu'elle n'est pas déjà dans la TODO list
2. Ouvrez une issue pour discussion
3. Proposez une Pull Request si validé

### Développer

```bash
# 1. Fork le projet
# 2. Clone votre fork
git clone <votre-fork>
cd ubuntu_vm_mcp

# 3. Créer une branche
git checkout -b feature/ma-fonctionnalite

# 4. Développer et tester
./launch_vm.sh --rebuild

# 5. Commit et push
git add .
git commit -m "feat: ajout de ma fonctionnalité"
git push origin feature/ma-fonctionnalite

# 6. Ouvrir une Pull Request
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📄 Licence

MIT License - Voir fichier [LICENSE](LICENSE)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🙏 Remerciements

- **Ubuntu** pour l'excellent système d'exploitation
- **XFCE** pour le desktop environnement léger
- **TigerVNC** pour le serveur VNC performant
- **Anthropic** pour Claude AI
- **Ollama** pour les LLMs locaux
- **Docker** pour la containerisation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📞 Support & Contact

- **Documentation:** Ce README et `mcp/README_mcp.md`
- **Issues:** Utilisez le système d'issues GitHub
- **Discussions:** GitHub Discussions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<div align="center">

**🔥 Fait avec ❤️ pour la communauté IA 🤖**

**⭐ Si ce projet vous est utile, n'hésitez pas à lui donner une étoile !**

</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
