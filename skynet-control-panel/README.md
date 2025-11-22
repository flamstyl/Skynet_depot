# ⚡ Skynet Control Panel

**Interface Electron centralisée pour contrôler MCP Servers, Docker, n8n, Oracle Cloud**

---

## 📖 Vue d'ensemble

Skynet Control Panel est une application **Electron + React + TypeScript** qui fournit une interface graphique moderne pour gérer :

- **MCP Servers** : Statut, démarrage, arrêt, configuration
- **Docker** : Containers, images, volumes, stats CPU/RAM, logs
- **n8n** : Workflows, exécutions, monitoring
- **Oracle Cloud** : Compute instances, start/stop, metrics
- **System Health** : Monitoring CPU, RAM, disques, services

---

## 🏗️ Architecture

### Stack technique

- **Frontend** : React 18 + TypeScript + Tailwind CSS
- **Backend** : Electron (main process) + Node.js
- **Build** : Vite + electron-builder
- **State** : Zustand + TanStack Query
- **UI** : Lucide Icons + Recharts (graphs)

### Sécurité

✅ **contextIsolation**: true
✅ **sandbox**: true
✅ **nodeIntegration**: false
✅ **webSecurity**: true
✅ **IPC validé** : Schémas stricts pour chaque endpoint
✅ **Preload sécurisé** : Exposition minimale via contextBridge

---

## 📋 Prérequis

- **Node.js** : >= 18.0.0
- **npm** : >= 9.0.0
- **Docker** : (optionnel) pour module Docker
- **n8n** : (optionnel) pour module n8n
- **Oracle Cloud account** : (optionnel) pour module Oracle

---

## 🛠️ Installation

```bash
cd skynet-control-panel

# Installation dépendances
npm install

# Build Electron
npm run build:electron

# Développement
npm run dev

# Build production
npm run electron:build
```

---

## ⚙️ Configuration

### Variables d'environnement

Créez `.env` :

```bash
# n8n
N8N_URL=http://localhost:5678
N8N_API_KEY=your_api_key_here

# Oracle Cloud (optionnel)
OCI_CONFIG_FILE=~/.oci/config
OCI_PROFILE=DEFAULT
```

---

## 🚀 Utilisation

### Mode développement

```bash
npm run dev
```

### Build production

```bash
npm run electron:build
```

Résultat dans `release/` :
- AppImage (Linux)
- .deb (Debian/Ubuntu)

---

## 🧩 Modules

### 1. Dashboard
- Vue d'ensemble globale
- Stats Docker, MCP, n8n, Oracle
- Health checks système

### 2. Docker Control
- Liste containers (actifs + arrêtés)
- Start/Stop/Restart
- Stats temps réel (CPU/RAM)
- Logs streaming
- Images management

### 3. MCP Servers
- Liste serveurs configurés
- Status (actif/inactif)
- Démarrage/Arrêt serveurs
- Configuration viewer

### 4. n8n Workflows
- Liste workflows
- Exécution manuelle
- Historique runs
- Health check n8n

### 5. Oracle Cloud
- Liste instances compute
- Start/Stop instances
- Metrics (CPU/RAM/Storage)
- Cost tracking (TODO)

---

## 📊 APIs IPC

### Docker

```typescript
window.skynetAPI.docker.listContainers()
window.skynetAPI.docker.startContainer(id)
window.skynetAPI.docker.stopContainer(id)
window.skynetAPI.docker.getStats(id)
window.skynetAPI.docker.getLogs(id)
```

### MCP

```typescript
window.skynetAPI.mcp.listServers()
window.skynetAPI.mcp.getServerStatus(name)
```

### n8n

```typescript
window.skynetAPI.n8n.listWorkflows()
window.skynetAPI.n8n.executeWorkflow(id)
```

### Oracle Cloud

```typescript
window.skynetAPI.oracle.listInstances()
window.skynetAPI.oracle.startInstance(id)
window.skynetAPI.oracle.stopInstance(id)
```

---

## 🔒 Sécurité

### Electron Security Checklist

- [x] contextIsolation enabled
- [x] sandbox enabled
- [x] nodeIntegration disabled
- [x] webSecurity enabled
- [x] remote module disabled
- [x] IPC whitelist strict
- [x] Secrets via environment variables

### Bonnes pratiques

- Pas de `eval()` ou code dynamique
- Validation stricte de tous les inputs IPC
- Logs audit des actions critiques
- Pas de stockage de secrets en clair

---

## 🐛 Dépannage

### Docker non accessible

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### n8n API non accessible

Vérifiez :
- n8n est démarré (`docker ps | grep n8n`)
- API Key configurée dans `.env`
- URL correcte (`N8N_URL`)

### Oracle Cloud SDK

Configurez `~/.oci/config` selon [documentation OCI](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/sdkconfig.htm)

---

## 🚀 Roadmap V2

- [ ] Support Kubernetes (k3s/k8s)
- [ ] Intégration Grafana/Prometheus
- [ ] Terminal intégré
- [ ] Multi-serveurs (clusters)
- [ ] Mode "Sentinelle" (alertes)
- [ ] Plugins système
- [ ] Thèmes customisables
- [ ] Support Terraform/Ansible

---

## 📜 License

MIT License - Skynet Project

---

**Créé avec ❤️ pour la communauté DevOps**
