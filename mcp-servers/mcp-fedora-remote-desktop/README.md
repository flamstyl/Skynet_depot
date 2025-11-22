# 🖥️ MCP Fedora Remote Desktop Control

**Serveur MCP (Model Context Protocol) pour gérer le bureau à distance sur Fedora Linux**

Ce MCP server permet à une IA de configurer, démarrer et gérer un accès bureau à distance sécurisé sur une machine Fedora Linux, avec support de :

- 🪟 **GNOME Remote Desktop** (RDP natif Wayland)
- 🖼️ **TigerVNC** (VNC pour X11)
- 🌊 **WayVNC** (VNC pour Wayland)
- 🔐 **xrdp** (RDP pour X11)

---

## 📋 Table des matières

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Tools disponibles](#tools-disponibles)
- [Exemples d'utilisation](#exemples-dutilisation)
- [Sécurité](#sécurité)
- [Comparatif des backends](#comparatif-des-backends)
- [Dépannage](#dépannage)

---

## 🎯 Prérequis

### Système

- **OS** : Fedora Linux (39, 40, 41+)
- **Node.js** : >= 18.0.0
- **Desktop** : GNOME (recommandé), KDE Plasma, ou autres
- **SELinux** : Permissive ou configuré pour remote desktop

### Outils système

- `firewalld` : Gestion du firewall
- `systemd` : Gestion des services
- `ssh` : Pour tunnels SSH (recommandé)

---

## 📦 Installation

### Installation automatique

```bash
cd mcp-servers/mcp-fedora-remote-desktop
chmod +x scripts/install.sh
./scripts/install.sh
```

Le script :
- ✅ Vérifie Node.js
- ✅ Détecte l'environnement (Wayland/X11)
- ✅ Propose d'installer le backend recommandé
- ✅ Configure firewalld
- ✅ Installe les dépendances npm
- ✅ Compile le projet

### Installation manuelle

```bash
# Installer les dépendances
npm install

# Compiler
npm run build

# Installer un backend (ex: GNOME Remote Desktop)
sudo dnf install gnome-remote-desktop
```

---

## ⚙️ Configuration

### Configuration dans Claude Code CLI

Ajoutez dans `~/.claude.json` :

```json
{
  "mcpServers": {
    "fedora-remote-desktop": {
      "command": "node",
      "args": [
        "/home/user/Skynet_depot/mcp-servers/mcp-fedora-remote-desktop/dist/index.js"
      ],
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

---

## 🛠️ Tools disponibles

### Détection

| Tool | Description |
|------|-------------|
| `detect_environment` | Détecte Wayland/X11 et backends installés |
| `list_remote_desktop_backends` | Liste tous les backends supportés |

### Configuration

| Tool | Description |
|------|-------------|
| `install_backend` | Installe un backend remote desktop |
| `configure_backend` | Configure port, mot de passe, encryption |
| `configure_firewall` | Ouvre/ferme ports firewall |

### Service

| Tool | Description |
|------|-------------|
| `start_remote_desktop` | Démarre le service remote desktop |
| `stop_remote_desktop` | Arrête le service |
| `status_remote_desktop` | Affiche le statut actuel |

### Réseau

| Tool | Description |
|------|-------------|
| `test_port_accessibility` | Teste si un port est accessible |
| `get_network_info` | Récupère IP, interfaces réseau |

### Instructions

| Tool | Description |
|------|-------------|
| `generate_ssh_tunnel_instructions` | Génère les commandes SSH tunnel |

---

## 💡 Exemples d'utilisation

### Exemple 1 : Configuration initiale sécurisée

```
Humain: "Active le bureau à distance sur ma Fedora"

IA :
1. detect_environment()
   → Wayland + GNOME détecté
   → Recommandation: gnome-remote-desktop

2. install_backend({backendId: "gnome-remote-desktop"})
   → Installation via dnf

3. configure_backend({
     backendId: "gnome-remote-desktop",
     config: {
       listenAddress: "localhost",
       authentication: {method: "password", temporary: true}
     }
   })
   → Mot de passe généré: Xy9$mK2#pL8qR5vT

4. configure_firewall({
     action: "open",
     port: 3389,
     zone: "trusted"
   })

5. start_remote_desktop({backendId: "gnome-remote-desktop"})

6. get_network_info()
   → IP LAN: 192.168.1.50

7. generate_ssh_tunnel_instructions({
     remoteHost: "192.168.1.50",
     remoteUser: "john",
     protocol: "rdp",
     remotePort: 3389
   })

Résultat affiché:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 CONNEXION SSH TUNNEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Sur votre machine locale :
   ssh -L 3389:localhost:3389 john@192.168.1.50

2. Laissez ce terminal ouvert

3. Connectez-vous avec un client RDP :
   - Adresse: localhost:3389
   - Mot de passe: Xy9$mK2#pL8qR5vT

Clients recommandés:
  - Remmina (Linux)
  - Microsoft Remote Desktop (Windows/Mac)
```

### Exemple 2 : Status et debugging

```
Humain: "Je n'arrive pas à me connecter"

IA :
1. status_remote_desktop()
   → Service actif ✓
   → Port 3389 ✓
   → Firewall ouvert ✓

2. test_port_accessibility({port: 3389})
   → localhost: ✓
   → LAN: ✓

3. Diagnostic : La connexion fonctionne.
   Vérifiez que le tunnel SSH est actif et que vous
   utilisez le bon mot de passe.
```

---

## 🔒 Sécurité

### Architecture de sécurité recommandée

**Niveau 1 : SSH Tunnel (⭐⭐⭐ Recommandé)**

```
[Client] ←→ [SSH Tunnel] ←→ [localhost:3389] ←→ [Remote Desktop]
         Chiffré              Local uniquement
```

- Service écoute sur localhost uniquement
- Aucun port exposé sur Internet
- Chiffrement SSH end-to-end

**Niveau 2 : LAN Only (⭐⭐)**

```
[Client LAN] ←→ [192.168.1.x:3389] ←→ [Remote Desktop]
             Firewall zone: home
```

- Port ouvert uniquement sur l'interface LAN
- Accès restreint au réseau local

**Niveau 3 : WAN (⚠️ Non recommandé)**

- Port exposé sur Internet
- Nécessite mot de passe fort
- Recommandation : fail2ban, VPN, ou éviter

### Fonctionnalités de sécurité

✅ Génération automatique de mots de passe forts
✅ Mots de passe temporaires (expiration auto)
✅ Avertissements si port WAN exposé
✅ Validation stricte des inputs
✅ Logs sans secrets

---

## 📊 Comparatif des backends

| Backend | Protocol | Wayland | X11 | Recommandé | Notes |
|---------|----------|---------|-----|------------|-------|
| **GNOME Remote Desktop** | RDP | ✅ | ✅ | **OUI** | Natif Wayland, excellent support |
| **WayVNC** | VNC | ✅ | ❌ | OUI | VNC pour Wayland |
| **TigerVNC** | VNC | ❌ | ✅ | Non | VNC classique X11 |
| **xrdp** | RDP | ❌ | ✅ | Non | RDP pour X11 |

**Recommandation générale** : GNOME Remote Desktop (fonctionne partout)

---

## 🐛 Dépannage

### Problème : "Backend not installed"

```bash
# Installer GNOME Remote Desktop
sudo dnf install gnome-remote-desktop

# Installer TigerVNC
sudo dnf install tigervnc-server

# Installer WayVNC
sudo dnf install wayvnc
```

### Problème : "Firewall blocks connection"

```bash
# Vérifier firewalld
sudo firewall-cmd --list-all

# Ouvrir port manuellement
sudo firewall-cmd --zone=home --add-port=3389/tcp --permanent
sudo firewall-cmd --reload
```

### Problème : SELinux bloque la connexion

```bash
# Vérifier SELinux
sudo ausearch -m avc -ts recent

# Mode permissif temporaire (debugging)
sudo setenforce 0

# Configurer SELinux pour remote desktop
sudo setsebool -P use_virtualbox 1
```

---

## 📄 Licence

MIT

---

**Fait avec ❤️ pour Claude Code CLI sur Fedora Linux**
