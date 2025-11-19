# 🚀 PasswordVault MCP — Quick Start Guide

**Get started in 5 minutes!**

---

## ⚡ Option 1 : Démarrage rapide (scripts automatiques)

### Windows

```powershell
# 1. Cloner le projet
git clone https://github.com/skynet/passwordvault-mcp.git
cd passwordvault-mcp

# 2. Lancer tous les services
.\scripts\start_all.ps1
```

### Linux / macOS

```bash
# 1. Cloner le projet
git clone https://github.com/skynet/passwordvault-mcp.git
cd passwordvault-mcp

# 2. Rendre le script exécutable
chmod +x scripts/start_all.sh

# 3. Lancer tous les services
./scripts/start_all.sh
```

**C'est tout !** Le backend Python et le serveur MCP démarreront automatiquement.

---

## 🔧 Option 2 : Installation manuelle

### 1. Backend Python

```bash
cd app/backend_python

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur
python vault_server.py
```

Le backend sera accessible sur **http://127.0.0.1:5555**

### 2. MCP Server (optionnel)

```bash
cd app/mcp

# Installer les dépendances
npm install

# Copier l'environnement
cp .env.example .env

# Éditer .env et ajouter votre clé Anthropic (pour l'IA)
# ANTHROPIC_API_KEY=sk-ant-...

# Lancer le serveur
node server.js
```

Le MCP sera accessible sur **http://127.0.0.1:3000**

### 3. WPF Frontend

```bash
cd app/Desktop

# Restaurer les packages
dotnet restore

# Build
dotnet build

# Lancer
dotnet run
```

---

## 🎮 Première utilisation

### 1. Créer un vault de démonstration

```bash
cd scripts
python create_demo_vault.py
```

- **Master password** : `DemoPassword123!`
- **Fichier** : `data/vault_demo.vault`
- **Entrées** : 5 exemples

### 2. Ouvrir l'application WPF

1. Lancer l'application (voir ci-dessus)
2. Entrer le master password : `DemoPassword123!`
3. Explorer les fonctionnalités :
   - 📋 Liste des mots de passe
   - ➕ Ajouter une entrée
   - 🔍 Rechercher
   - 🛡️ Audit de sécurité (si MCP actif)

---

## 🧪 Tester les composants

### Test crypto engine

```bash
cd app/backend_python
python crypto_engine.py
```

Sortie attendue :
```
✓ Salt généré
✓ Clé dérivée
✓ Données chiffrées
✓ Données déchiffrées
✓ Vérification intégrité OK
```

### Test storage manager

```bash
python storage_manager.py
```

### Test HIBP

```bash
python hibp_checker.py
```

---

## ⚙️ Configuration

### Changer le port du backend

Éditer `app/backend_python/config.yaml` :

```yaml
server:
  port: 5555  # Changer ici
```

### Activer l'IA (MCP)

1. Obtenir une clé API Anthropic : https://console.anthropic.com/
2. Éditer `app/mcp/.env` :
   ```
   ANTHROPIC_API_KEY=sk-ant-votre-clé-ici
   ```
3. Relancer le MCP : `node server.js`

---

## 🐛 Problèmes courants

### "Cannot connect to backend"

**Cause** : Le backend Python n'est pas démarré

**Solution** :
```bash
cd app/backend_python
python vault_server.py
```

Vérifier : http://127.0.0.1:5555/health

### "Port 5555 already in use"

**Cause** : Un autre processus utilise le port

**Solution** :
```bash
# Windows
netstat -ano | findstr :5555
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:5555 | xargs kill -9
```

### Dépendances Python manquantes

**Solution** :
```bash
cd app/backend_python
pip install -r requirements.txt
```

### Node.js : "Cannot find module"

**Solution** :
```bash
cd app/mcp
rm -rf node_modules
npm install
```

---

## 📚 Prochaines étapes

1. **Lire la documentation complète** : [README.md](README.md)
2. **Comprendre l'architecture** : [docs/architecture.md](docs/architecture.md)
3. **Créer votre propre vault** :
   - Ouvrir l'application WPF
   - Choisir un master password **fort**
   - Ajouter vos mots de passe

4. **Activer la synchronisation** :
   - Lancer le MCP server
   - Dans Settings → Sync → Enable

5. **Utiliser l'audit IA** :
   - Onglet Audit → Run Security Audit
   - Suivre les recommandations

---

## 🔐 Conseils de sécurité

✅ **DO** :
- Utiliser un master password de 16+ caractères
- Activer 2FA sur vos comptes importants
- Faire des backups réguliers de votre `.vault`
- Changer vos mots de passe tous les 90 jours

❌ **DON'T** :
- Ne partagez JAMAIS votre master password
- Ne stockez pas le master password en clair
- N'utilisez pas "DemoPassword123!" en production !
- Ne commitez pas votre fichier `.vault` sur Git

---

## 💡 Astuce

Pour un workflow optimal :

```bash
# Terminal 1 : Backend
cd app/backend_python && python vault_server.py

# Terminal 2 : MCP (optionnel)
cd app/mcp && node server.js

# Terminal 3 : WPF
cd app/Desktop && dotnet run
```

Ou utilisez le script `start_all` pour tout démarrer en une commande !

---

## 🆘 Besoin d'aide ?

- 📖 Documentation complète : [README.md](README.md)
- 🐛 Signaler un bug : [GitHub Issues](https://github.com/skynet/passwordvault-mcp/issues)
- 📧 Contact : skynet@example.com

---

**Bon voyage dans le monde sécurisé de PasswordVault ! 🔐🔥**
