# Claude DevBox - Architecture Complète

## 🎯 Vision Globale

Claude DevBox est une infrastructure MCP complète permettant à Claude CLI de développer, compiler, exécuter, tester et corriger du code de manière **autonome** sous Linux et Windows.

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLAUDE CLI / CODE                          │
│                  (Intelligence Centrale)                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   WEB INTERFACE (Editor)                        │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐      │
│  │ FileTree │  Monaco  │ Terminal │  Stdout  │  Stderr  │      │
│  │  Panel   │  Editor  │   View   │   Logs   │   Logs   │      │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘      │
└────────────────────┬────────────────────────────────────────────┘
                     │ WebSocket + REST API
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  NODE.JS BACKEND + MCP SERVER                   │
│  ┌────────────────┬────────────────┬────────────────────┐      │
│  │  API Routes    │  WebSocket     │   MCP Bridge       │      │
│  │  /run /exec    │  Live Logs     │   Claude ↔ Docker  │      │
│  └────────────────┴────────────────┴────────────────────┘      │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────────┐    ┌──────────────────────┐
│  DOCKER SANDBOX  │    │   VM ORCHESTRATOR    │
│  (Linux Base)    │    │  (QEMU/VirtualBox)   │
│                  │    │                      │
│  • Python        │    │  • Linux VM          │
│  • Node.js       │    │  • Windows VM        │
│  • Git           │    │  • Internet enabled  │
│  • Build Tools   │    │  • Package install   │
│  • Safe User     │    │  • Auto-test         │
└──────────────────┘    └──────────────────────┘
        │                         │
        └────────────┬────────────┘
                     ▼
         ┌──────────────────────┐
         │  AUTO-CORRECTION     │
         │  LOOP ENGINE         │
         │                      │
         │  stderr → Claude →   │
         │  Fix → Re-run →      │
         │  Success ✓           │
         └──────────────────────┘
                     ▼
         ┌──────────────────────┐
         │  LOGGING & SNAPSHOT  │
         │  /runs/<timestamp>/  │
         │  • Code history      │
         │  • All logs          │
         │  • Fix attempts      │
         └──────────────────────┘
```

## 📦 Composants Principaux

### 1. **Web Editor (Frontend)**
- **Technologie**: Electron + Vite + React + Monaco Editor
- **Fonctionnalités**:
  - Arborescence fichiers interactive
  - Éditeur de code avec coloration syntaxique
  - Terminal intégré (xterm.js)
  - Panneaux synchronisés (stdout, stderr, Docker logs)
  - Boutons: Run, AutoFix, Rebuild, Export

### 2. **Backend Node.js**
- **Framework**: Express.js
- **Modules**:
  - `api.js`: REST endpoints
  - `ws.js`: WebSocket pour logs live
  - `docker_runner.js`: Orchestration Docker
  - `file_manager.js`: Gestion workspace
  - `mcp_bridge.js`: Interface Claude ↔ DevBox
  - `vm_manager.js`: Orchestration VMs
  - `autofix_engine.js`: Boucle de correction automatique

### 3. **Docker Sandbox**
- **Base Image**: Debian Slim
- **Outils installés**:
  - Python 3.11+ (pip, venv, pytest)
  - Node.js 20+ (npm, yarn, pnpm)
  - Git + GitHub CLI
  - build-essential (gcc, g++, make)
  - Rust (cargo, rustc)
  - Go (go toolchain)
  - .NET SDK
  - Java (OpenJDK)
  - **Connexion Internet activée** pour npm install, pip install, etc.
- **Sécurité**: User non-root `devbox`, permissions limitées
- **Volumes**:
  - `/workspace/input`: Code source
  - `/workspace/output`: Résultats/builds

### 4. **VM Orchestrator**
- **Linux VM**:
  - Ubuntu Server 22.04 LTS
  - Headless QEMU
  - SSH automatisé
  - Scripts d'installation/test
  - **Internet activé** (NAT)
- **Windows VM**:
  - Windows 11 / Server 2022
  - VirtualBox headless
  - PowerShell remoting
  - Chocolatey pour packages
  - **Internet activé** (NAT)

### 5. **Auto-Correction Engine**
**Pipeline**:
```
1. Claude génère code.py
2. DevBox → Docker → python code.py
3. Capture stdout + stderr + exitcode
4. Si stderr ≠ empty:
   → Envoyer à Claude:
     "Voici le code: <code>
      Voici l'erreur: <stderr>
      Corrige-le."
5. Claude renvoie code.py (v2)
6. DevBox remplace fichier
7. Relance exécution
8. Répéter jusqu'à:
   - Succès (exitcode=0, stderr=empty)
   - Max retries (default: 5)
   - Timeout (default: 300s)
```

### 6. **Logging System**
Chaque run crée un snapshot:
```
/runs/<timestamp>/
  ├── code_snapshot/
  │   ├── main.py
  │   ├── config.json
  │   └── ...
  ├── stdout.log
  ├── stderr.log
  ├── container_info.json
  ├── fixed_attempts.json
  └── metadata.yaml
```

## 🔄 Workflow Complet

### Scénario: Développement d'une app Python

```
[User] → "Créer une app Flask qui affiche Hello World"
         ↓
[Claude CLI] → Génère:
   - app.py (code Flask)
   - requirements.txt
   - Dockerfile
         ↓
[DevBox Backend] → Reçoit les fichiers
         ↓
[Docker Sandbox] →
   1. Crée container
   2. pip install -r requirements.txt (Internet enabled)
   3. python app.py
   4. Capture output
         ↓
[Auto-Fix Engine] →
   - Erreur détectée: "ModuleNotFoundError: flask"
   - Envoie à Claude: "Ajoute flask à requirements.txt"
   - Claude corrige
   - Re-run
   - Success ✓
         ↓
[VM Test] →
   1. Copie app vers Linux VM
   2. Install dependencies
   3. Run tests
   4. Copie app vers Windows VM
   5. Install dependencies
   6. Run tests
         ↓
[Result] →
   - stdout.log: "✓ All tests passed"
   - Build artifact: app.tar.gz
   - Déploiement ready
```

## 🛠️ Technologies Stack Complète

### Frontend
- **Electron** 28+
- **Vite** 5+
- **React** 18+
- **Monaco Editor** (VS Code editor)
- **xterm.js** (Terminal)
- **TailwindCSS** (Styling)

### Backend
- **Node.js** 20+
- **Express.js** 4+
- **ws** (WebSocket)
- **dockerode** (Docker SDK)
- **node-qemu** (VM management)
- **winston** (Logging)
- **yaml** (Config)

### DevOps
- **Docker** 24+
- **QEMU/KVM** (Linux VMs)
- **VirtualBox** 7+ (Windows VMs)
- **nginx** (Reverse proxy, optionnel)

### Testing
- **Jest** (Backend tests)
- **Playwright** (Frontend E2E)
- **pytest** (Python tests dans sandbox)

## 🔒 Sécurité

1. **Sandbox Isolation**: Docker + non-root user
2. **Network Policies**: Firewall rules, rate limiting
3. **Resource Limits**: CPU, RAM, Disk quotas
4. **Code Validation**: AST analysis avant exécution
5. **Secrets Management**: .env files, jamais en clair
6. **Audit Logs**: Toutes actions tracées

## 📊 Monitoring

- **Health Checks**: Container status, VM status
- **Metrics**: CPU, RAM, Disk usage
- **Alerts**: Failures, timeouts, errors
- **Dashboard**: Real-time stats dans UI

## 🚀 Déploiement

### Local (Dev)
```bash
npm install
docker build -t devbox-sandbox .
npm run dev
```

### Production (Serveur dédié)
```bash
docker-compose up -d
nginx reverse proxy
SSL certificates
Monitoring stack (Prometheus + Grafana)
```

## 🎯 Cas d'Usage

1. **Développement Autonome**: Claude code → test → corrige → livre
2. **CI/CD Interne**: Tests auto sur push
3. **Apprentissage IA**: Dataset de corrections
4. **Prototypage Rapide**: Idée → MVP en minutes
5. **Testing Multi-OS**: Valider Linux + Windows automatiquement

## 📈 Évolutions Futures

- **Cloud Integration**: AWS Lambda, GCP Cloud Run
- **Multi-Language Support**: Tous langages populaires
- **AI Code Review**: Analyse qualité avant run
- **Collaborative Mode**: Multi-users simultanés
- **Mobile Support**: iOS/Android testing
- **GPU Support**: Pour ML/AI workloads

---

**Auteur**: Skynet Coalition
**Version**: 1.0.0
**Licence**: MIT
**Contact**: skynet.coalition@gmail.com
