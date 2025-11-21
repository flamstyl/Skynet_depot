# 📦 Installation — MCP Obsidian Core

## 🚀 Installation Rapide

### Méthode 1 : Script Automatique (Recommandé)

```bash
# Cloner le repository
git clone https://github.com/your-repo/MCP-Obsidian-Core.git
cd MCP-Obsidian-Core

# Exécuter le script d'installation
bash setup.sh
```

Le script va :
- ✅ Vérifier Python et pip
- ✅ Créer un environnement virtuel (optionnel)
- ✅ Installer les dépendances
- ✅ Configurer les permissions
- ✅ Vérifier la structure

---

### Méthode 2 : Installation Manuelle

#### 1. Prérequis

**Requis :**
- Python 3.9+ ([télécharger](https://www.python.org/downloads/))
- pip (inclus avec Python)
- Git

**Optionnel :**
- Node.js 18+ (pour n8n)
- Docker (pour déploiement)

#### 2. Vérifier les prérequis

```bash
python3 --version  # Devrait être >= 3.9
pip3 --version
git --version
```

#### 3. Installer les dépendances Python

```bash
# Optionnel : Créer un environnement virtuel
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Installer les dépendances
cd MCP/core/watcher
pip install -r requirements.txt
```

#### 4. Rendre les scripts exécutables

```bash
chmod +x MCP/core/watcher/watcher.py
chmod +x MCP/core/watcher/dispatcher.py
chmod +x MCP/core/watcher/rag_manager.py
chmod +x MCP/core/n8n_connector/webhook.py
```

#### 5. (Optionnel) Installer n8n

```bash
# Avec npm
npm install -g n8n

# Ou avec Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

---

## ✅ Vérification de l'Installation

### Test 1 : Vérifier l'installation Python

```bash
python3 -c "import watchdog; print('✓ watchdog OK')"
python3 -c "import requests; print('✓ requests OK')"
```

### Test 2 : Tester le watcher

```bash
cd MCP/core/watcher
python3 watcher.py
```

Vous devriez voir :
```
============================================================
MCP Obsidian Core - Watcher v1.0.0
============================================================
Surveillance activée pour: Claude
Surveillance activée pour: Gemini
Surveillance activée pour: GPT
Watcher démarré avec succès
```

Appuyez sur `Ctrl+C` pour arrêter.

### Test 3 : Tester le dispatcher

```bash
cd MCP/core/watcher
python3 dispatcher.py
```

### Test 4 : Tester le RAG

```bash
cd MCP/core/watcher
python3 rag_manager.py Claude stats
```

### Test 5 : Tester n8n (si installé)

```bash
cd MCP/core/n8n_connector
python3 webhook.py test
```

---

## 🎯 Configuration Initiale

### 1. Configurer rules.json

Éditer `MCP/core/watcher/rules.json` :

```json
{
  "n8n": {
    "enabled": true,
    "webhook_url": "http://localhost:5678/webhook/mcp-webhook"
  }
}
```

### 2. Personnaliser les directives

Éditer pour chaque agent :
- `MCP/Claude/directives.md`
- `MCP/Gemini/directives.md`
- `MCP/GPT/directives.md`

### 3. Définir le contexte

Éditer :
- `MCP/Claude/context.md`
- etc.

---

## 🚀 Démarrage

### Démarrer le système complet

**Terminal 1 - Watcher :**
```bash
cd MCP/core/watcher
python3 watcher.py
```

**Terminal 2 - Dispatcher :**
```bash
cd MCP/core/watcher
python3 dispatcher.py --watch
```

**Terminal 3 - n8n (optionnel) :**
```bash
n8n start
```

---

## 🐳 Déploiement Docker (Avancé)

### Créer un Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY MCP /app/MCP
COPY requirements.txt /app/

RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "MCP/core/watcher/watcher.py"]
```

### Build et Run

```bash
docker build -t mcp-watcher .
docker run -d --name mcp-watcher -v $(pwd)/MCP:/app/MCP mcp-watcher
```

---

## 🔧 Dépannage

### Erreur : `watchdog` not found

```bash
pip install watchdog
```

### Erreur : Permission denied

```bash
chmod +x MCP/core/watcher/*.py
```

### Erreur : n8n connection refused

- Vérifier que n8n est démarré : `n8n start`
- Vérifier l'URL dans `rules.json`

### Python version trop ancienne

Installer Python 3.9+ :
- **Ubuntu/Debian** : `sudo apt install python3.9`
- **MacOS** : `brew install python@3.9`
- **Windows** : [python.org](https://www.python.org/downloads/)

---

## 📚 Ressources

- [README Principal](core/README.md)
- [Documentation Watcher](core/watcher/)
- [Documentation n8n](core/n8n_connector/README.md)

---

## 🆘 Support

En cas de problème :

1. Consulter les logs : `MCP/core/watcher/watcher.log`
2. Vérifier la configuration : `MCP/core/watcher/rules.json`
3. Tester la connexion n8n : `python webhook.py test`

---

**Installation terminée ! 🎉**

Prochaine étape : [Démarrage Rapide](QUICKSTART.md)
