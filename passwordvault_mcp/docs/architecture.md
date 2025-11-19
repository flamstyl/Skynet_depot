# 🔐 PasswordVault MCP — Architecture Skynet

## Vue d'ensemble

**PasswordVault MCP** est un gestionnaire de mots de passe sécurisé, local-first, avec synchronisation chiffrée et audit IA.

```
┌─────────────────────────────────────────────────────────────┐
│                    WPF Desktop UI (.NET 6)                  │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────┐  │
│  │ VaultPage   │ │ AddPassword  │ │    AuditPage        │  │
│  │             │ │              │ │  (IA + HIBP)        │  │
│  └─────────────┘ └──────────────┘ └─────────────────────┘  │
│         │               │                   │               │
│         └───────────────┴───────────────────┘               │
│                         │                                   │
│         ┌───────────────┴───────────────┐                   │
│         │  Services Layer (C#)          │                   │
│         │  - VaultClient                │                   │
│         │  - MCPClient                  │                   │
│         │  - CryptoClient               │                   │
│         └───────────────┬───────────────┘                   │
└─────────────────────────┼───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Python     │  │  MCP Server  │  │   Fichier    │
│   Backend    │  │  (Node.js)   │  │   .vault     │
│              │  │              │  │  (chiffré)   │
│ ┌──────────┐ │  │ ┌──────────┐ │  │              │
│ │ Crypto   │ │  │ │  Sync    │ │  │  AES-256-GCM │
│ │ Engine   │ │  │ │  Tools   │ │  │  PBKDF2      │
│ │          │ │  │ └──────────┘ │  │              │
│ │AES-256   │ │  │              │  └──────────────┘
│ │PBKDF2    │ │  │ ┌──────────┐ │
│ └──────────┘ │  │ │IA Bridge │ │
│              │  │ │          │ │
│ ┌──────────┐ │  │ │ Claude   │ │
│ │ Storage  │ │  │ │ API      │ │
│ │ Manager  │ │  │ └──────────┘ │
│ │          │ │  │              │
│ │ Load/    │ │  │ ┌──────────┐ │
│ │ Save     │ │  │ │  HIBP    │ │
│ └──────────┘ │  │ │  Check   │ │
│              │  │ └──────────┘ │
│ ┌──────────┐ │  └──────────────┘
│ │  HIBP    │ │
│ │ Checker  │ │         │
│ └──────────┘ │         │
│              │         ▼
│ ┌──────────┐ │  ┌──────────────┐
│ │  Flask   │ │  │   Claude API │
│ │  Server  │ │  │   (Externe)  │
│ └──────────┘ │  └──────────────┘
└──────────────┘         │
                         ▼
                  ┌──────────────┐
                  │ HIBP API     │
                  │ (Externe)    │
                  └──────────────┘
```

## Modules principaux

### 1️⃣ **Python Backend** (`backend_python/`)

#### `crypto_engine.py`
- **Rôle** : Chiffrement/déchiffrement des données
- **Algorithmes** :
  - Dérivation de clé : `PBKDF2-HMAC-SHA256` (600k itérations)
  - Chiffrement : `AES-256-GCM`
  - Salage : 32 bytes aléatoires
  - IV : 16 bytes aléatoires par entrée

**Fonctions principales** :
```python
derive_key(master_password: str, salt: bytes) -> bytes
encrypt_entry(key: bytes, data: dict) -> bytes
decrypt_entry(key: bytes, blob: bytes) -> dict
```

#### `storage_manager.py`
- **Rôle** : Gestion du fichier vault local
- **Format** : JSON chiffré avec métadonnées
- **Fichier** : `data/vault_local.vault`

**Structure du vault** :
```json
{
  "version": "1.0",
  "salt": "<base64>",
  "created_at": "2025-11-18T...",
  "last_modified": "2025-11-18T...",
  "entries": [
    {
      "id": "uuid",
      "encrypted_data": "<base64>",
      "iv": "<base64>",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

**Fonctions principales** :
```python
load_vault(master_password: str) -> List[dict]
save_vault(master_password: str, entries: List[dict]) -> None
add_entry(master_password: str, entry: dict) -> str
update_entry(master_password: str, entry_id: str, entry: dict) -> None
delete_entry(master_password: str, entry_id: str) -> None
```

#### `hibp_checker.py`
- **Rôle** : Vérification des fuites via HaveIBeenPwned
- **Méthode** : k-Anonymity (hash SHA-1 partiel)
- **API** : `https://api.pwnedpasswords.com/range/{hash_prefix}`

**Fonction principale** :
```python
check_password_breach(password: str) -> dict
# Returns: {"breached": bool, "count": int}
```

#### `vault_server.py`
- **Rôle** : API Flask pour communication WPF ↔ Python
- **Port** : 5555 (local only)

**Endpoints** :
```
POST /vault/unlock         → déverrouiller vault
POST /vault/lock           → verrouiller vault
GET  /vault/entries        → liste entries
POST /vault/entry/add      → ajouter entry
PUT  /vault/entry/update   → modifier entry
DELETE /vault/entry/delete → supprimer entry
POST /vault/hibp/check     → vérifier mot de passe
```

---

### 2️⃣ **MCP Server** (`mcp/`)

#### `server.js`
- **Rôle** : Hub central pour sync, IA, HIBP
- **Port** : 3000
- **Protocole** : REST + WebSocket pour sync temps réel

**Endpoints** :
```
POST /sync/push            → upload vault chiffré
GET  /sync/pull            → récupérer vault chiffré
GET  /sync/status          → état synchronisation
POST /ai/audit             → audit sécurité via Claude
POST /ai/improve           → suggestions amélioration
POST /hibp/check           → vérification HIBP
GET  /health               → health check
```

#### `tools/sync.js`
- **Rôle** : Gestion versions et synchronisation
- **Stratégie** : Last-write-wins avec détection conflits
- **Stockage** : `data/sync_cache/`

**Fonctions** :
```javascript
pushVault(deviceId, encryptedVault, timestamp)
pullVault(deviceId) -> encryptedVault
resolveConflict(vault1, vault2) -> mergedVault
```

#### `tools/ia_bridge.js`
- **Rôle** : Pont vers Claude API
- **Prompts** : Chargés depuis `ai_prompts/`

**Fonctions** :
```javascript
assessSecurity(metadata) -> securityReport
improvePassword(context) -> suggestions
detectRisks(patterns) -> riskAnalysis
```

#### `tools/hibp.js`
- **Rôle** : Proxy HIBP avec cache
- **Cache** : 24h pour éviter spam API

---

### 3️⃣ **WPF Frontend** (`Desktop/`)

#### Architecture MVVM

**Views** :
- `VaultPage.xaml` : Liste des credentials + recherche
- `AddPasswordPage.xaml` : Formulaire + générateur
- `AuditPage.xaml` : Rapports IA + HIBP
- `SettingsPage.xaml` : Configuration

**ViewModels** :
- `VaultViewModel.cs` : Gestion état vault
- `AddPasswordViewModel.cs` : Logique ajout
- `AuditViewModel.cs` : Affichage résultats audit
- `SettingsViewModel.cs` : Paramètres

**Services** :
- `VaultClient.cs` : Appels API Python (port 5555)
- `MCPClient.cs` : Appels MCP Server (port 3000)
- `CryptoClient.cs` : Helpers crypto côté client

---

## Flux de données

### 🔓 Déverrouillage du vault
```
1. User entre master password (WPF)
   ↓
2. WPF → Python Backend (POST /vault/unlock)
   ↓
3. Python dérive clé PBKDF2
   ↓
4. Python déchiffre vault_local.vault
   ↓
5. Python retourne entries déchiffrées (en mémoire)
   ↓
6. WPF affiche dans VaultPage
```

### 🔄 Synchronisation
```
1. User active sync (WPF)
   ↓
2. Python chiffre vault complet
   ↓
3. WPF → MCP (POST /sync/push avec blob chiffré)
   ↓
4. MCP stocke dans sync_cache/
   ↓
5. Autres devices → MCP (GET /sync/pull)
   ↓
6. MCP retourne blob chiffré
   ↓
7. Device déchiffre localement
```

### 🤖 Audit IA
```
1. User clique "Audit" (WPF)
   ↓
2. WPF → MCP (POST /ai/audit avec métadonnées)
   Note: Jamais les mots de passe en clair !
   ↓
3. MCP → Claude API avec prompt assess_security.md
   ↓
4. Claude retourne rapport JSON
   ↓
5. MCP → WPF
   ↓
6. WPF affiche dans AuditPage
```

### 🔍 Vérification HIBP
```
1. User vérifie mot de passe (WPF)
   ↓
2. WPF hash SHA-1 localement
   ↓
3. WPF → MCP (POST /hibp/check avec hash prefix)
   ↓
4. MCP → HIBP API (k-anonymity)
   ↓
5. MCP retourne résultat
   ↓
6. WPF affiche alerte si compromis
```

---

## Sécurité

### 🔐 Principes

1. **Zero-knowledge** : Le MCP ne voit jamais les données en clair
2. **Local-first** : Tout déchiffrement se fait localement
3. **Encryption-at-rest** : Vault toujours chiffré sur disque
4. **Encryption-in-transit** : HTTPS pour toutes communications
5. **No password logging** : Jamais de logs contenant passwords

### 🛡️ Mesures de protection

- **Master password** : Jamais stocké, uniquement dérivé
- **Salage unique** : Chaque vault a son salt
- **IV aléatoire** : Chaque entrée a son IV
- **Mémoire sécurisée** : Nettoyage après usage (SecureString en C#)
- **Rate limiting** : Protection brute-force sur unlock
- **Auto-lock** : Verrouillage après inactivité

### 🚨 Threat Model

**Protections contre** :
- ✅ Vol du fichier .vault → inutile sans master password
- ✅ MITM sync → données déjà chiffrées
- ✅ Compromission MCP → données illisibles
- ✅ Rainbow tables → PBKDF2 + salt unique

**Hors scope** :
- ❌ Keylogger sur machine locale
- ❌ Compromission OS
- ❌ Physical access + memory dump

---

## Technologies

| Composant | Stack | Justification |
|-----------|-------|---------------|
| Frontend | WPF .NET 6 | UI native Windows, performance |
| Backend | Python 3.11+ | Crypto libraries matures |
| MCP | Node.js 18+ | Async I/O, WebSocket |
| Crypto | cryptography (Python) | FIPS 140-2 compatible |
| Storage | JSON chiffré | Simple, portable |
| Sync | REST + WebSocket | Standard, firewall-friendly |
| IA | Claude 4.5 Sonnet | Meilleure analyse sémantique |

---

## Déploiement

### Requirements

**Python** :
```
cryptography>=41.0.0
Flask>=3.0.0
requests>=2.31.0
PyYAML>=6.0.0
```

**Node.js** :
```
express>=4.18.0
ws>=8.14.0
axios>=1.6.0
dotenv>=16.3.0
```

**.NET** :
```
.NET 6 SDK
Newtonsoft.Json
System.Security.Cryptography
```

### Installation

1. Installer Python backend : `pip install -r requirements.txt`
2. Installer MCP : `npm install` dans `/mcp`
3. Build WPF : `dotnet build Desktop/PasswordVault.csproj`
4. Configurer `.env` avec Claude API key
5. Lancer Python : `python vault_server.py`
6. Lancer MCP : `node server.js`
7. Lancer WPF : `dotnet run --project Desktop/`

---

## Évolutions futures

- 🔜 Support biométrique (Windows Hello)
- 🔜 Import/export (1Password, LastPass)
- 🔜 Générateur passphrase (diceware)
- 🔜 Support TOTP/2FA
- 🔜 Browser extension
- 🔜 Mobile app (chiffrement identique)
- 🔜 Partage sécurisé (chiffrement asymétrique)

---

## License

Skynet Internal - Confidential 🔥

---

*Architecture v1.0 — 2025-11-18*
