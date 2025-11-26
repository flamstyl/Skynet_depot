# 🔐 PasswordVault MCP — Skynet Secure Vault v1.0

**Gestionnaire de mots de passe local, chiffré, avec synchronisation MCP et audit IA**

[![Security](https://img.shields.io/badge/Security-AES--256-brightgreen)](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)
[![Python](https://img.shields.io/badge/Python-3.11%2B-blue)](https://www.python.org/)
[![.NET](https://img.shields.io/badge/.NET-6.0-purple)](https://dotnet.microsoft.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)

---

## 🎯 Vue d'ensemble

**PasswordVault MCP** est un gestionnaire de mots de passe **sécurisé**, **local-first**, et **open-source** conçu pour :

- ✅ Stocker vos mots de passe **chiffrés localement** (AES-256-GCM)
- ✅ Synchroniser de manière **sécurisée** entre vos appareils (chiffrement de bout en bout)
- ✅ Auditer la sécurité via **IA** (Claude)
- ✅ Détecter les fuites avec **HaveIBeenPwned**
- ✅ Interface **WPF native** Windows

### Philosophie

> **Zero-knowledge, Local-first, Privacy-centric**

- Vos mots de passe **ne quittent JAMAIS** votre machine en clair
- Le serveur MCP ne voit **que des données chiffrées**
- L'IA ne reçoit **jamais** vos mots de passe, uniquement des métadonnées
- Vous **contrôlez** vos données

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  WPF Desktop (.NET 6)                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────────────────┐  │
│  │ VaultPage  │ │   Audit    │ │      Settings          │  │
│  └────────────┘ └────────────┘ └────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Python   │  │   MCP    │  │  .vault  │
  │ Backend  │  │  Server  │  │  (AES)   │
  │ (Flask)  │  │ (Node.js)│  │          │
  └──────────┘  └──────────┘  └──────────┘
       │             │
       │             ├─→ Claude API (IA)
       │             └─→ HIBP API (fuites)
       │
       └─→ Crypto (AES-256 + PBKDF2)
```

Voir [docs/architecture.md](docs/architecture.md) pour les détails complets.

---

## 🚀 Installation rapide

### Prérequis

- **Python 3.11+**
- **Node.js 18+**
- **.NET 6 SDK** (pour WPF)
- **Windows 10/11** (pour l'interface WPF)

### 1️⃣ Backend Python

```bash
cd app/backend_python
pip install -r requirements.txt
```

### 2️⃣ MCP Server (optionnel)

```bash
cd app/mcp
npm install
cp .env.example .env
# Éditer .env et ajouter ANTHROPIC_API_KEY
```

### 3️⃣ WPF Frontend

```bash
cd app/Desktop
dotnet restore
dotnet build
```

---

## 🎮 Démarrage

### Mode complet (Python + MCP + WPF)

**Terminal 1 — Backend Python** :
```bash
cd app/backend_python
python vault_server.py
```

**Terminal 2 — MCP Server** :
```bash
cd app/mcp
node server.js
```

**Terminal 3 — WPF** :
```bash
cd app/Desktop
dotnet run
```

### Mode minimal (Python + WPF uniquement)

Si vous n'avez pas besoin de sync ni d'IA :

```bash
# Terminal 1
cd app/backend_python
python vault_server.py

# Terminal 2
cd app/Desktop
dotnet run
```

---

## 📝 Utilisation

### Créer un vault

1. Lancer l'application WPF
2. Entrer un **master password fort** (12+ caractères)
3. Le vault sera créé et chiffré localement

### Ajouter un mot de passe

1. Cliquer sur "Add Entry"
2. Remplir :
   - Site web / Service
   - Nom d'utilisateur
   - Mot de passe
   - Notes (optionnel)
3. Sauvegarder → Chiffrement automatique

### Audit de sécurité

1. Aller dans l'onglet "Audit"
2. Cliquer "Run Security Audit"
3. L'IA analysera :
   - Force des mots de passe
   - Fuites détectées (HIBP)
   - Recommandations

### Synchronisation multi-devices

1. Activer le MCP Server
2. Dans Settings → Sync → "Enable Sync"
3. Vos vaults seront synchronisés **chiffrés**

---

## 🔐 Sécurité

### Chiffrement

- **Algorithme** : AES-256-GCM
- **Dérivation de clé** : PBKDF2-HMAC-SHA256 (600k itérations)
- **Salage** : 32 bytes aléatoires par vault
- **IV** : 12 bytes aléatoires par entrée

### Threat Model

**Protégé contre** :
- ✅ Vol du fichier `.vault` → inutile sans master password
- ✅ MITM sur sync → données déjà chiffrées
- ✅ Compromission serveur MCP → aucune donnée en clair
- ✅ Rainbow tables → PBKDF2 + salt unique

**Hors scope** :
- ❌ Keylogger sur machine locale
- ❌ Compromission OS
- ❌ Physical access + memory dump

### Bonnes pratiques

1. **Master password** : Utilisez une passphrase forte (16+ caractères)
2. **Backup** : Sauvegardez votre fichier `.vault` régulièrement
3. **2FA** : Activez 2FA sur vos comptes importants
4. **Rotation** : Changez vos mots de passe tous les 90 jours

---

## 🧪 Tests et Démonstration

### Créer un vault de démonstration

```bash
cd scripts
python create_demo_vault.py
```

Cela créera `data/vault_demo.vault` avec :
- **Master password** : `DemoPassword123!`
- 5 entrées exemples

### Voir les infos du vault de démo

```bash
python create_demo_vault.py --info
```

### Tester le backend Python

```bash
cd app/backend_python
python crypto_engine.py    # Test crypto
python storage_manager.py  # Test storage
python hibp_checker.py     # Test HIBP
```

---

## 📂 Structure du projet

```
passwordvault_mcp/
├── app/
│   ├── backend_python/          # Backend Flask + crypto
│   │   ├── crypto_engine.py     # AES-256 + PBKDF2
│   │   ├── storage_manager.py   # Gestion vault
│   │   ├── hibp_checker.py      # HaveIBeenPwned
│   │   ├── vault_server.py      # API REST
│   │   └── requirements.txt
│   │
│   ├── mcp/                     # MCP Server Node.js
│   │   ├── server.js            # Serveur principal
│   │   ├── tools/
│   │   │   ├── sync.js          # Synchronisation
│   │   │   ├── ia_bridge.js     # Pont Claude API
│   │   │   └── hibp.js          # Proxy HIBP
│   │   └── package.json
│   │
│   └── Desktop/                 # WPF Frontend
│       ├── Services/
│       │   ├── VaultClient.cs   # Client Python
│       │   └── MCPClient.cs     # Client MCP
│       ├── Views/
│       │   └── UnlockPage.xaml
│       └── PasswordVault.csproj
│
├── ai_prompts/                  # Prompts IA
│   ├── assess_security.md
│   ├── improve_password.md
│   └── detect_risks.md
│
├── data/                        # Données (gitignored)
│   └── vault_local.vault
│
├── docs/
│   └── architecture.md          # Documentation architecture
│
└── README.md
```

---

## 🤖 Fonctionnalités IA

### Audit de sécurité

L'IA analyse vos mots de passe (via **métadonnées uniquement**) :

```
✅ Longueur
✅ Complexité
✅ Âge
✅ Patterns faibles
```

**Exemple de rapport** :
```json
{
  "score": 75,
  "strength": "strong",
  "weaknesses": ["Password older than 90 days"],
  "recommendations": ["Rotate this password soon"]
}
```

### Détection de risques

Analyse globale du vault :

```
🔴 Critiques : Mots de passe réutilisés
🟠 Warnings : Mots de passe anciens
🟡 Recommandations : Optimisations
```

---

## 🌐 API Endpoints

### Python Backend (port 5555)

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/vault/unlock` | POST | Déverrouiller vault |
| `/vault/entries` | GET | Liste des entrées |
| `/vault/entry/add` | POST | Ajouter entrée |
| `/vault/hibp/check` | POST | Vérifier fuite |

### MCP Server (port 3000)

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/sync/push` | POST | Upload vault chiffré |
| `/sync/pull` | GET | Télécharger vault |
| `/ai/audit` | POST | Audit sécurité |
| `/hibp/check` | POST | Check HIBP |

---

## 🛠️ Configuration

### Backend Python

Éditer `app/backend_python/config.yaml` :

```yaml
vault:
  auto_lock_timeout: 15  # minutes

crypto:
  pbkdf2_iterations: 600000

server:
  port: 5555
```

### MCP Server

Éditer `app/mcp/.env` :

```env
MCP_PORT=3000
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 🐛 Troubleshooting

### Backend ne démarre pas

```bash
# Vérifier que le port 5555 est libre
netstat -an | grep 5555

# Tester les dépendances
pip install -r requirements.txt
```

### MCP ne se connecte pas

```bash
# Vérifier Node.js version
node --version  # Doit être 18+

# Réinstaller les dépendances
npm ci
```

### WPF : "Cannot connect to backend"

1. Vérifier que `vault_server.py` tourne
2. Tester manuellement : `curl http://127.0.0.1:5555/health`

---

## 📜 License

**MIT License** — Voir `LICENSE` file

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

---

## 🔥 Roadmap

### v1.1
- [ ] Support Windows Hello (biométrique)
- [ ] Import/Export (1Password, LastPass)
- [ ] Générateur passphrase

### v2.0
- [ ] Support TOTP/2FA
- [ ] Browser extension (Chrome, Firefox)
- [ ] Mobile app (Android, iOS)
- [ ] Partage sécurisé (chiffrement asymétrique)

---

## 🙏 Crédits

- **Chiffrement** : [cryptography](https://cryptography.io/)
- **IA** : [Anthropic Claude](https://www.anthropic.com/)
- **HIBP** : [HaveIBeenPwned](https://haveibeenpwned.com/)
- **Framework** : Flask, Express, WPF

---

## 📞 Support

- 📧 Email : [skynet@example.com](mailto:skynet@example.com)
- 🐛 Issues : [GitHub Issues](https://github.com/skynet/passwordvault-mcp/issues)
- 📖 Docs : [docs/architecture.md](docs/architecture.md)

---

## ⚠️ Disclaimer

**PasswordVault MCP** est fourni "tel quel" sans garantie. Bien que toutes les précautions aient été prises pour assurer la sécurité, l'utilisateur est responsable de :

- La sauvegarde régulière du fichier `.vault`
- Le choix d'un master password fort
- La sécurisation de sa machine locale

**Ne stockez jamais votre master password en clair.**

---

<div align="center">

**🔐 Construit avec ❤️ par Skynet Team**

*Sécurité. Privacy. Contrôle.*

[![GitHub](https://img.shields.io/badge/GitHub-Skynet-black?logo=github)](https://github.com/skynet)
[![Twitter](https://img.shields.io/badge/Twitter-@SkynetDev-blue?logo=twitter)](https://twitter.com/skynetdev)

</div>
