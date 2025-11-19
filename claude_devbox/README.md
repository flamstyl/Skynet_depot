# Claude DevBox - Skynet Autonomous Development Environment

<div align="center">

![Claude DevBox](https://img.shields.io/badge/Claude-DevBox-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)

**Une infrastructure MCP complète permettant à Claude CLI de développer, compiler, exécuter, tester et corriger du code de manière autonome**

[Installation](#-installation) •
[Quick Start](#-quick-start) •
[Architecture](#-architecture) •
[Documentation](#-documentation) •
[Examples](#-examples)

</div>

---

## 🎯 Vue d'Ensemble

Claude DevBox est un environnement de développement autonome qui permet à Claude CLI/Code de :

- ✨ **Générer** du code dans de multiples langages
- 🐳 **Exécuter** dans un sandbox Docker sécurisé
- 🔧 **Corriger** automatiquement les erreurs détectées
- 🧪 **Tester** sous Linux et Windows (VMs)
- 📊 **Logger** chaque exécution avec snapshots
- 🌐 **Accéder** à Internet pour installer des dépendances
- 🔄 **Itérer** jusqu'à obtenir un code fonctionnel

## 🏗️ Architecture

```
┌─────────────┐
│ Claude CLI  │ ← Intelligence Centrale
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Web Editor (Monaco + React)        │
│  • Éditeur de code                  │
│  • Terminal intégré                 │
│  • Panneaux stdout/stderr/logs      │
└──────┬──────────────────────────────┘
       │ REST + WebSocket
       ▼
┌─────────────────────────────────────┐
│  Backend Node.js + MCP Server       │
│  • API Routes                       │
│  • Docker Orchestration             │
│  • Auto-fix Engine                  │
│  • VM Manager                       │
└──────┬──────────────────────────────┘
       │
       ├──────────┬───────────┐
       ▼          ▼           ▼
┌───────────┐ ┌──────────┐ ┌─────────┐
│  Docker   │ │ Linux VM │ │ Win VM  │
│  Sandbox  │ │  (QEMU)  │ │ (VBox)  │
└───────────┘ └──────────┘ └─────────┘
```

## 🚀 Installation

### Prérequis

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Docker** 24+ ([Download](https://www.docker.com/))
- **QEMU** (optionnel, pour Linux VM)
- **VirtualBox** (optionnel, pour Windows VM)
- **Git**

### 1. Cloner le projet

```bash
git clone https://github.com/flamstyl/Skynet_depot.git
cd Skynet_depot/claude_devbox
```

### 2. Installer les dépendances

```bash
# Frontend
cd editor
npm install
cd ..

# Backend
cd server
npm install
cd ..
```

### 3. Builder le Docker Sandbox

```bash
cd docker
bash build.sh
cd ..
```

### 4. Configuration

Modifier `server/config.yaml` selon vos besoins :

```yaml
server:
  port: 3000

docker:
  memory: 512  # MB
  cpuQuota: 50000

autofix:
  enabled: true
  maxAttempts: 5

mcp:
  enabled: false
  claudeApiKey: "your-api-key-here"
```

## ⚡ Quick Start

### Méthode 1 : Mode Développement

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd editor
npm run dev
```

Ouvrir http://localhost:5173

### Méthode 2 : Mode Electron

```bash
cd editor
npm run electron:dev
```

### Méthode 3 : Docker Compose (Production)

```bash
docker-compose up -d
```

## 📖 Utilisation

### 1. Interface Web

1. **Ouvrir** l'éditeur web
2. **Écrire** du code ou charger un fichier
3. **Cliquer** sur "Run" pour exécuter
4. **Observer** les outputs en temps réel
5. Si erreur → **Auto-Fix** activé → Claude corrige automatiquement

### 2. API REST

```bash
# Exécuter du code
curl -X POST http://localhost:3000/api/run \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"Hello World\")",
    "language": "python",
    "autoFix": true
  }'

# Obtenir l'historique
curl http://localhost:3000/api/runs

# Lire un fichier workspace
curl "http://localhost:3000/api/workspace/file?path=main.py"
```

### 3. WebSocket (Logs en direct)

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'stdout':
      console.log('[OUT]', data.message);
      break;
    case 'stderr':
      console.error('[ERR]', data.message);
      break;
    case 'execution_complete':
      console.log('✓ Done:', data);
      break;
  }
};
```

## 🎨 Exemples

### Exemple 1 : Hello World Python

```python
# main.py
print("Hello from Claude DevBox!")
```

**Résultat** :
```
✓ Execution completed successfully (234ms)
[stdout] Hello from Claude DevBox!
```

### Exemple 2 : Code avec erreur → Auto-fix

**Code initial** (erreur) :
```python
# bug.py
print("Hello"
```

**Logs** :
```
[ERROR] SyntaxError: unexpected EOF while parsing
[INFO] Auto-fix triggered...
[INFO] Claude fixing code...
[SUCCESS] Code fixed, re-running...
✓ Execution completed successfully
```

**Code corrigé par Claude** :
```python
# bug.py
print("Hello")  # Fixed: added closing parenthesis
```

### Exemple 3 : Installation de dépendances (Internet activé)

```javascript
// test.js
const axios = require('axios');

(async () => {
  const res = await axios.get('https://api.github.com');
  console.log('GitHub API Status:', res.status);
})();
```

**Le sandbox peut installer axios via npm grâce à l'accès Internet !**

### Exemple 4 : Test Multi-OS

```bash
# Tester sous Linux VM
curl -X POST http://localhost:3000/api/vm/test \
  -d '{"code": "print(\"Linux test\")", "os": "linux", "language": "python"}'

# Tester sous Windows VM
curl -X POST http://localhost:3000/api/vm/test \
  -d '{"code": "Write-Host \"Windows test\"", "os": "windows", "language": "powershell"}'
```

## 🛠️ Langages Supportés

Le sandbox Docker supporte **nativement** :

| Langage    | Version | Outils inclus                |
|------------|---------|------------------------------|
| Python     | 3.11+   | pip, pytest, venv            |
| JavaScript | Node 20 | npm, yarn, pnpm, ts-node     |
| TypeScript | Latest  | tsc, @types/node             |
| Rust       | Stable  | cargo, rustc, cargo-watch    |
| Go         | 1.21+   | go toolchain                 |
| Java       | OpenJDK | javac, java, maven           |
| C/C++      | Latest  | gcc, g++, make, cmake        |
| C#         | .NET 8  | dotnet SDK                   |
| Ruby       | Latest  | gem, bundler, rspec          |
| PHP        | Latest  | php-cli, composer            |
| Shell      | Bash    | bash, sh                     |

## 🔧 Workflow Auto-Fix

```
┌─────────────────────┐
│ 1. Code généré      │
│    par Claude       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. Exécution Docker │
└──────────┬──────────┘
           │
           ├─ Succès? ──────► Terminé ✓
           │
           ▼ Erreur
┌─────────────────────┐
│ 3. Envoyer stderr   │
│    à Claude         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 4. Claude analyse   │
│    et corrige       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 5. Re-test          │
└──────────┬──────────┘
           │
           └─► Répéter jusqu'à succès
               (max 5 tentatives)
```

## 📊 Logging & Snapshots

Chaque exécution crée un snapshot dans `/runs/<timestamp>_<runId>/` :

```
runs/2025-01-19T12-30-45_abc123/
  ├── code_snapshot/
  │   └── main.py
  ├── stdout.log
  ├── stderr.log
  ├── metadata.yaml
  ├── container_info.json
  └── fixed_attempts.json
```

**metadata.yaml** :
```yaml
runId: abc123
timestamp: 2025-01-19T12:30:45.123Z
language: python
exitCode: 0
duration: 234
success: true
```

## 🖥️ Utilisation des VMs

### Linux VM (QEMU)

```bash
cd vms

# Première fois : installation Ubuntu
bash qemu_launcher.sh

# Après installation, relancer pour démarrer
bash qemu_launcher.sh

# Connexion SSH
ssh -p 2222 devbox@localhost

# Setup de l'environnement
bash install_test_linux.sh
```

### Windows VM (VirtualBox)

```bash
# 1. Créer une VM Windows dans VirtualBox nommée "DevBox-Windows"
# 2. Installer Windows 11/Server
# 3. Dans la VM, lancer PowerShell en admin :

Set-ExecutionPolicy Bypass -Scope Process -Force
.\install_test_windows.ps1
```

## 🔒 Sécurité

- ✅ **Sandbox Docker** : isolation totale
- ✅ **User non-root** : permissions limitées
- ✅ **Resource limits** : CPU, RAM, Disk quotas
- ✅ **Network policies** : firewall configurable
- ✅ **Path validation** : prévention path traversal
- ✅ **Timeout** : exécutions limitées dans le temps

## 🧪 Tests

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd editor
npm test

# Integration tests
bash scripts/run_tests.sh
```

## 📚 Documentation Complète

- [Architecture détaillée](docs/architecture.md)
- [API Reference](docs/api_reference.md) (à créer)
- [Configuration Guide](docs/configuration.md) (à créer)
- [Development Guide](docs/development.md) (à créer)

## 🚧 Roadmap

- [x] Docker Sandbox multi-langages
- [x] Auto-fix engine
- [x] VM Linux/Windows support
- [x] Web editor avec Monaco
- [x] WebSocket live logs
- [x] Snapshot system
- [ ] MCP Bridge vers Claude API
- [ ] Cloud deployment (AWS/GCP)
- [ ] GPU support pour ML/AI
- [ ] Mobile testing (iOS/Android)
- [ ] Collaborative mode
- [ ] Plugin system

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](CONTRIBUTING.md) (à créer).

## 📝 Licence

MIT License - voir [LICENSE](LICENSE) (à créer)

## 👥 Auteurs

**Skynet Coalition**
- Email: skynet.coalition@gmail.com
- GitHub: [@flamstyl](https://github.com/flamstyl)

## 🙏 Remerciements

- **Anthropic** pour Claude CLI/Code
- **Monaco Editor** pour l'éditeur
- **Docker** pour le sandboxing
- **QEMU** & **VirtualBox** pour les VMs

---

<div align="center">

**Made with ⚡ by Skynet Coalition**

[⬆ Retour en haut](#claude-devbox---skynet-autonomous-development-environment)

</div>
