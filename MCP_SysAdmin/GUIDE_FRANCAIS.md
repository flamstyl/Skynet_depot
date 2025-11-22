# 🇫🇷 Guide Complet MCP SysAdmin en Français

## 📚 Table des matières

1. [Introduction](#introduction)
2. [Installation détaillée](#installation-détaillée)
3. [Configuration pour Claude Code](#configuration-pour-claude-code)
4. [Guide des 112 outils](#guide-des-112-outils)
5. [Exemples d'utilisation pratiques](#exemples-dutilisation-pratiques)
6. [Résolution de problèmes](#résolution-de-problèmes)

## Introduction

MCP SysAdmin est un serveur Model Context Protocol qui transforme Claude en un véritable administrateur système Linux. Il expose 112 outils répartis en 5 catégories principales.

### Pourquoi utiliser MCP SysAdmin ?

- ✅ **Automatisation complète** : Claude peut installer et configurer n'importe quel environnement
- 🚀 **Gain de temps** : Plus besoin de chercher les commandes, Claude les connaît toutes
- 🔒 **Sécurisé** : Validation des arguments et gestion des permissions
- 📊 **Monitoring** : Surveillance en temps réel de vos serveurs
- 🐳 **Docker natif** : Gestion complète de Docker et Docker Compose

## Installation détaillée

### Étape 1 : Vérifier les prérequis

```bash
# Vérifier Node.js (version 18 ou supérieure)
node --version

# Si Node.js n'est pas installé
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier npm
npm --version
```

### Étape 2 : Installation du serveur MCP

```bash
# Se placer dans le répertoire
cd MCP_SysAdmin

# Installer les dépendances
npm install

# Compiler le code TypeScript
npm run build

# Vérifier que la compilation a réussi
ls -la dist/index.js
```

### Étape 3 : Test du serveur

```bash
# Tester le serveur manuellement
echo '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}' | node dist/index.js

# Vous devriez voir :
# 🚀 MCP SysAdmin Server v1.0.0
# ...
# 🛠️  112 outils disponibles
```

## Configuration pour Claude Code

### Pour Claude Desktop

1. Ouvrir le fichier de configuration :

```bash
# macOS
code ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Linux
code ~/.config/Claude/claude_desktop_config.json

# Windows
code %APPDATA%\Claude\claude_desktop_config.json
```

2. Ajouter le serveur MCP :

```json
{
  "mcpServers": {
    "sysadmin": {
      "command": "node",
      "args": ["/chemin/absolu/vers/MCP_SysAdmin/dist/index.js"]
    }
  }
}
```

3. Redémarrer Claude Desktop

### Pour Claude Code CLI

```bash
# Éditer la configuration
mkdir -p ~/.config/claude
nano ~/.config/claude/config.json

# Ajouter :
{
  "mcp": {
    "servers": {
      "sysadmin": {
        "command": "node",
        "args": ["/chemin/absolu/vers/MCP_SysAdmin/dist/index.js"]
      }
    }
  }
}
```

### Vérification de la configuration

Une fois configuré, demandez à Claude :

```
Peux-tu lister tes outils d'administration système disponibles ?
```

Claude devrait répondre avec la liste des 112 outils.

## Guide des 112 outils

### 📦 Gestion de Paquets (16 outils)

#### APT (Debian/Ubuntu)

| Outil | Description | Exemple d'utilisation |
|-------|-------------|----------------------|
| `apt_install` | Installer des paquets | "Installe nginx et postgresql" |
| `apt_search` | Rechercher des paquets | "Cherche les paquets python disponibles" |
| `apt_remove` | Supprimer des paquets | "Supprime apache2" |
| `apt_update` | Mettre à jour la liste | "Mets à jour apt" |
| `apt_upgrade` | Upgrader les paquets | "Upgrade tous les paquets système" |
| `apt_list_installed` | Lister les paquets installés | "Liste tous les paquets installés" |

#### NPM (Node.js)

| Outil | Description | Exemple |
|-------|-------------|---------|
| `npm_install` | Installer des paquets npm | "Installe typescript et ts-node en dev" |
| `npm_list` | Lister les paquets npm | "Liste les paquets npm globaux" |

#### PIP (Python)

| Outil | Description | Exemple |
|-------|-------------|---------|
| `pip_install` | Installer des paquets Python | "Installe django et pytest" |
| `pip_list` | Lister les paquets Python | "Liste tous les paquets pip installés" |

#### Autres gestionnaires

| Outil | Description | Exemple |
|-------|-------------|---------|
| `cargo_install` | Installer des crates Rust | "Installe ripgrep via cargo" |
| `go_install` | Installer des paquets Go | "Installe golang.org/x/tools/gopls" |
| `snap_install` | Installer des snaps | "Installe code en snap classic" |
| `flatpak_install` | Installer des flatpaks | "Installe com.spotify.Client" |

### 🐳 Docker (27 outils)

#### Gestion des Containers

| Outil | Description | Exemple |
|-------|-------------|---------|
| `docker_ps` | Lister les containers | "Liste tous les containers Docker" |
| `docker_start` | Démarrer des containers | "Démarre les containers web et db" |
| `docker_stop` | Arrêter des containers | "Arrête le container nginx" |
| `docker_restart` | Redémarrer des containers | "Redémarre le container redis" |
| `docker_logs` | Voir les logs | "Affiche les 200 dernières lignes du container app" |
| `docker_exec` | Exécuter une commande | "Exécute bash dans le container web" |
| `docker_stats` | Statistiques containers | "Affiche les stats du container db" |
| `docker_remove` | Supprimer des containers | "Supprime les containers arrêtés" |
| `docker_inspect` | Inspecter un container | "Inspecte le container nginx" |

#### Gestion des Images

| Outil | Description | Exemple |
|-------|-------------|---------|
| `docker_images` | Lister les images | "Liste toutes les images Docker" |
| `docker_pull` | Télécharger une image | "Pull l'image postgres:15" |
| `docker_build` | Construire une image | "Build l'image myapp:latest depuis ." |
| `docker_rmi` | Supprimer des images | "Supprime les images non utilisées" |
| `docker_tag` | Tagger une image | "Tag l'image app:latest en app:v1.0" |

#### Networks & Volumes

| Outil | Description | Exemple |
|-------|-------------|---------|
| `docker_network_list` | Lister les réseaux | "Liste les réseaux Docker" |
| `docker_network_create` | Créer un réseau | "Crée un réseau bridge nommé mynet" |
| `docker_network_remove` | Supprimer des réseaux | "Supprime le réseau oldnet" |
| `docker_volume_list` | Lister les volumes | "Liste tous les volumes" |
| `docker_volume_create` | Créer un volume | "Crée un volume data" |
| `docker_volume_remove` | Supprimer des volumes | "Supprime le volume temp" |

#### Docker Compose

| Outil | Description | Exemple |
|-------|-------------|---------|
| `docker_compose_up` | Démarrer Compose | "Lance docker-compose en mode détaché" |
| `docker_compose_down` | Arrêter Compose | "Arrête docker-compose et supprime les volumes" |
| `docker_compose_logs` | Logs Compose | "Affiche les logs du service web" |
| `docker_compose_ps` | Status Compose | "Affiche le status des services" |

#### System

| Outil | Description | Exemple |
|-------|-------------|---------|
| `docker_system_info` | Info système Docker | "Affiche les infos système Docker" |
| `docker_system_df` | Utilisation disque | "Montre l'utilisation disque de Docker" |
| `docker_system_prune` | Nettoyer Docker | "Nettoie tous les éléments non utilisés" |

### 💻 Environnements de Développement (18 outils)

#### Installation de langages

| Outil | Description | Exemple |
|-------|-------------|---------|
| `install_node` | Installer Node.js | "Installe Node.js LTS via NVM" |
| `node_version` | Version Node.js | "Affiche la version de Node" |
| `install_python` | Installer Python | "Installe Python 3.11 avec pip" |
| `python_version` | Version Python | "Quelle version de Python est installée ?" |
| `create_venv` | Créer virtualenv | "Crée un venv dans ./venv" |
| `install_go` | Installer Go | "Installe Go 1.22" |
| `go_version` | Version Go | "Version de Go installée" |
| `install_rust` | Installer Rust | "Installe Rust et Cargo" |
| `rust_version` | Version Rust | "Version de Rust" |
| `install_java` | Installer Java | "Installe OpenJDK 17" |
| `java_version` | Version Java | "Version de Java" |
| `install_php` | Installer PHP | "Installe PHP 8.2 avec extensions mysql et curl" |
| `php_version` | Version PHP | "Version de PHP" |

#### Bases de données

| Outil | Description | Exemple |
|-------|-------------|---------|
| `install_postgres` | Installer PostgreSQL | "Installe PostgreSQL et crée un user" |
| `install_mysql` | Installer MySQL | "Installe MySQL Server" |
| `install_mongodb` | Installer MongoDB | "Installe MongoDB 7.0" |
| `install_redis` | Installer Redis | "Installe Redis Server" |

#### Outils de dev

| Outil | Description | Exemple |
|-------|-------------|---------|
| `install_vscode` | Installer VSCode | "Installe Visual Studio Code" |
| `install_neovim` | Installer Neovim | "Installe Neovim" |
| `configure_git` | Configurer Git | "Configure Git avec mon nom et email" |
| `install_git_tools` | Installer outils Git | "Installe Git, Git LFS et GitHub CLI" |

### ⚙️ Administration Système (31 outils)

#### Systemd

| Outil | Description | Exemple |
|-------|-------------|---------|
| `systemd_status` | Status d'un service | "Status du service nginx" |
| `systemd_start` | Démarrer services | "Démarre nginx et postgresql" |
| `systemd_stop` | Arrêter services | "Arrête apache2" |
| `systemd_restart` | Redémarrer services | "Redémarre nginx" |
| `systemd_enable` | Activer au boot | "Active nginx au démarrage" |
| `systemd_disable` | Désactiver au boot | "Désactive apache2" |
| `systemd_list` | Lister services | "Liste tous les services systemd" |
| `systemd_logs` | Logs d'un service | "Logs des 200 dernières lignes de nginx" |

#### Processus

| Outil | Description | Exemple |
|-------|-------------|---------|
| `process_list` | Lister processus | "Liste les 20 processus qui consomment le plus" |
| `kill_process` | Tuer un processus | "Kill le processus PID 1234" |
| `find_process` | Chercher processus | "Cherche les processus python" |
| `top_processes` | Top processus | "Top 15 processus par CPU" |

#### Monitoring

| Outil | Description | Exemple |
|-------|-------------|---------|
| `system_resources` | Ressources système | "Affiche CPU, RAM et disque" |
| `disk_usage` | Utilisation disque | "Montre l'espace disque" |
| `memory_usage` | Utilisation mémoire | "Affiche la mémoire" |
| `cpu_info` | Info CPU | "Infos sur le processeur" |

#### Utilisateurs & Permissions

| Outil | Description | Exemple |
|-------|-------------|---------|
| `create_user` | Créer utilisateur | "Crée l'utilisateur deploy" |
| `delete_user` | Supprimer utilisateur | "Supprime l'utilisateur test" |
| `add_to_group` | Ajouter aux groupes | "Ajoute user aux groupes docker,sudo" |
| `list_users` | Lister utilisateurs | "Liste tous les utilisateurs" |
| `chmod` | Changer permissions | "Donne les permissions 755 à /var/www" |
| `chown` | Changer propriétaire | "Change le owner de /app en www-data" |

#### Réseau

| Outil | Description | Exemple |
|-------|-------------|---------|
| `network_interfaces` | Interfaces réseau | "Liste les interfaces réseau" |
| `network_connections` | Connexions actives | "Affiche les connexions réseau" |
| `ping` | Ping un host | "Ping google.com 10 fois" |

#### Firewall (UFW)

| Outil | Description | Exemple |
|-------|-------------|---------|
| `ufw_status` | Status UFW | "Status du firewall" |
| `ufw_allow` | Autoriser port | "Ouvre le port 80 en TCP" |
| `ufw_deny` | Bloquer port | "Bloque le port 23" |
| `ufw_enable` | Activer UFW | "Active le firewall" |
| `ufw_disable` | Désactiver UFW | "Désactive le firewall" |

#### Logs

| Outil | Description | Exemple |
|-------|-------------|---------|
| `view_logs` | Voir fichier log | "Affiche les 100 dernières lignes de /var/log/nginx/error.log" |
| `journalctl_recent` | Logs système récents | "Logs système récents" |

### 🎨 Graphisme & Multimédia (15 outils)

#### ImageMagick

| Outil | Description | Exemple |
|-------|-------------|---------|
| `image_convert` | Convertir image | "Convertis photo.png en photo.jpg qualité 90" |
| `image_resize` | Redimensionner | "Redimensionne image.jpg à 800x600" |
| `image_crop` | Rogner image | "Crop image.png en 400x400 depuis position 100,100" |
| `image_rotate` | Rotation | "Tourne photo.jpg de 90 degrés" |
| `image_effect` | Appliquer effet | "Applique un effet blur d'intensité 5" |
| `image_info` | Info image | "Infos sur photo.jpg" |

#### FFmpeg

| Outil | Description | Exemple |
|-------|-------------|---------|
| `video_convert` | Convertir vidéo | "Convertis video.avi en video.mp4" |
| `extract_audio` | Extraire audio | "Extrait l'audio de video.mp4 en mp3" |
| `video_resize` | Redimensionner vidéo | "Resize video.mp4 à 1280x720" |
| `video_trim` | Couper vidéo | "Coupe video.mp4 de 00:01:00 pour 30 secondes" |
| `video_info` | Info vidéo | "Infos sur video.mp4" |

#### Outils terminal

| Outil | Description | Exemple |
|-------|-------------|---------|
| `figlet` | ASCII art | "Crée 'HELLO' en ASCII art avec la font banner" |
| `qrcode` | Générer QR code | "Génère un QR code pour https://example.com" |

#### Installation

| Outil | Description | Exemple |
|-------|-------------|---------|
| `install_imagemagick` | Installer ImageMagick | "Installe ImageMagick" |
| `install_ffmpeg` | Installer FFmpeg | "Installe FFmpeg" |
| `install_media_tools` | Installer tous les outils | "Installe tous les outils média" |

## Exemples d'utilisation pratiques

### Scénario 1 : Setup complet environnement Node.js

```
Claude, j'ai besoin d'un environnement Node.js complet pour développer une app web.

Peux-tu :
1. Installer Node.js LTS via NVM
2. Installer PostgreSQL avec un utilisateur
3. Installer Redis
4. Configurer Git avec mon nom "John Doe" et email "john@example.com"
5. Installer VSCode
6. Installer les paquets npm globaux : typescript, ts-node, nodemon
```

Claude va :
1. `install_node` avec version: "lts", useNvm: true
2. `install_postgres` avec createUser: true
3. `install_redis`
4. `configure_git` avec name et email
5. `install_vscode`
6. `npm_install` avec packages, global: true

### Scénario 2 : Déploiement Docker d'une app

```
J'ai une application web dans le dossier /home/user/myapp avec un Dockerfile et docker-compose.yml.

Peux-tu :
1. Vérifier que Docker est installé
2. Builder l'image avec le tag myapp:latest
3. Lancer docker-compose en mode détaché
4. Afficher les logs du service web
5. Vérifier que les containers tournent
```

Claude va :
1. `docker_system_info`
2. `docker_build` avec path: "/home/user/myapp", tag: "myapp:latest"
3. `docker_compose_up` avec file: "/home/user/myapp/docker-compose.yml", detach: true
4. `docker_compose_logs` avec service: "web"
5. `docker_compose_ps`

### Scénario 3 : Monitoring et debug d'un serveur

```
Mon serveur web est lent. Peux-tu m'aider à diagnostiquer ?

1. Affiche les ressources système (CPU, RAM, disque)
2. Montre les 10 processus qui consomment le plus de CPU
3. Vérifie le status du service nginx
4. Affiche les logs nginx récents
5. Vérifie les connexions réseau actives
```

Claude va :
1. `system_resources`
2. `top_processes` avec count: 10, sortBy: "cpu"
3. `systemd_status` avec service: "nginx"
4. `systemd_logs` avec service: "nginx", lines: 100
5. `network_connections`

### Scénario 4 : Traitement d'images en batch

```
J'ai 100 photos dans /home/user/photos/ qui sont trop grandes.

Peux-tu créer un script qui :
1. Vérifie qu'ImageMagick est installé
2. Redimensionne toutes les images à 1920x1080 max
3. Les convertit en JPEG qualité 85
4. Les sauvegarde dans /home/user/photos/optimized/
```

Claude va :
1. `install_imagemagick` (si nécessaire)
2. Utiliser `image_resize` et `image_convert` en boucle
3. Créer le script bash approprié

## Résolution de problèmes

### Problème : "Le serveur ne démarre pas"

**Solution :**
```bash
# Vérifier que les dépendances sont installées
cd MCP_SysAdmin
npm install

# Recompiler
npm run build

# Vérifier les erreurs
npm run dev
```

### Problème : "Permission denied" lors de l'utilisation d'outils

**Solution :**
```bash
# Vérifier que vous avez sudo
sudo -n true 2>&1

# Si sudo demande un mot de passe, configurer sudoers (OPTIONNEL ET RISQUÉ)
# sudo visudo
# Ajouter : votre_user ALL=(ALL) NOPASSWD: ALL

# OU utiliser sudo avant de lancer Claude
sudo true  # Entrer le mot de passe une fois
# Puis utiliser Claude normalement
```

### Problème : "Docker command not found"

**Solution :**
```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter votre user au groupe docker
sudo usermod -aG docker $USER
newgrp docker

# Vérifier
docker --version
```

### Problème : "Claude ne voit pas les outils"

**Solution :**
1. Vérifier que le serveur est bien configuré dans `claude_desktop_config.json`
2. Utiliser le **chemin absolu** vers `dist/index.js`
3. Redémarrer Claude Desktop complètement
4. Tester avec : "Liste tes outils disponibles"

### Problème : "Les commandes sont lentes"

**Cause :** Timeout par défaut à 30 secondes

**Solution :** Certaines opérations (apt update, docker build) peuvent être longues. Le timeout est configuré à 30s par défaut, mais peut aller jusqu'à 5 minutes pour les installations.

## Astuces et bonnes pratiques

### 1. Utiliser des commandes groupées

Au lieu de :
```
Installe docker
Installe docker-compose
Installe git
```

Dire :
```
Installe docker, docker-compose et git en une seule commande apt
```

### 2. Vérifier avant de modifier

```
Avant de redémarrer nginx, affiche-moi ses logs récents et son status
```

### 3. Utiliser le monitoring régulièrement

```
Affiche-moi un résumé système :
- Ressources (CPU, RAM, disque)
- Top 5 processus
- Services systemd actifs
- Containers Docker en cours
```

### 4. Sauvegarder les configurations

```
Avant de modifier la config de nginx, fais-en une copie de sauvegarde
```

### 5. Tester en environnement de dev d'abord

Ne jamais tester de nouvelles commandes directement en production !

## Support

Pour toute question ou problème :
- 📖 Consulter la documentation complète dans README.md
- 🐛 Signaler un bug sur GitHub
- 💡 Proposer une amélioration

---

**Bon développement avec MCP SysAdmin ! 🚀**
