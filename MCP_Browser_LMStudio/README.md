# 🟣 MCP_Browser_LMStudio

**Serveur MCP local** permettant à une IA (Claude, GPT, Gemini) de contrôler un navigateur web et d'interagir avec **LM Studio** (modèle IA local).

## 🎯 Fonctionnalités

- ✅ **Serveur FastAPI** avec API REST complète
- ✅ **Navigateur contrôlable** (Playwright headless ou PyWebView)
- ✅ **Client LM Studio** pour interroger des modèles locaux
- ✅ **Mémoire des interactions** (historique navigateur)
- ✅ **Authentification par token**
- ✅ **Logs détaillés** (`logs/server.log`)
- ✅ **Screenshots** avec export base64

## 📁 Structure du Projet

```
MCP_Browser_LMStudio/
├── app.py                      # Serveur FastAPI principal
├── browser_controller.py       # Contrôleur navigateur (Playwright/PyWebView)
├── lmstudio_client.py         # Client LM Studio API
├── models/
│   ├── __init__.py
│   ├── browser_models.py      # Schemas Pydantic navigateur
│   └── lm_models.py           # Schemas Pydantic LM Studio
├── logs/
│   └── server.log             # Logs du serveur
├── config.json                # Configuration
├── requirements.txt           # Dépendances Python
└── README.md                  # Ce fichier
```

## 🚀 Installation

### Prérequis

- **Python 3.11+**
- **LM Studio** installé et lancé (https://lmstudio.ai)
- Un modèle chargé dans LM Studio

### 1. Installer les dépendances

```bash
cd MCP_Browser_LMStudio
pip install -r requirements.txt
```

### 2. Installer Playwright Chromium

```bash
playwright install chromium
```

### 3. Configurer `config.json`

Éditez `config.json` :

```json
{
  "auth_token": "VOTRE_TOKEN_SECRET_ICI",
  "browser_engine": "playwright",
  "lmstudio": {
    "host": "http://localhost:1234",
    "model": null
  },
  "server": {
    "host": "0.0.0.0",
    "port": 8000
  }
}
```

**Important** : Changez `auth_token` pour sécuriser votre serveur.

### 4. Lancer LM Studio

1. Ouvrez **LM Studio**
2. Chargez un modèle (ex: `granite-3.0-2b-instruct`)
3. Allez dans l'onglet **Developer**
4. Cliquez sur **Start Server** (port 1234 par défaut)

### 5. Lancer le serveur MCP

```bash
python app.py
```

Vous devriez voir :

```
🚀 Démarrage de MCP_Browser_LMStudio
✅ LM Studio est accessible: ...
✅ Serveur prêt
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## 🧪 Tests des Routes

### 1. Vérifier le statut global

```bash
curl http://localhost:8000/status \
  -H "Authorization: Bearer VOTRE_TOKEN_SECRET_ICI"
```

**Réponse attendue** :

```json
{
  "server": "MCP_Browser_LMStudio",
  "version": "1.0.0",
  "status": "running",
  "browser": {
    "running": false,
    "engine": "playwright",
    "current_url": null,
    "title": null
  },
  "lmstudio": {
    "available": true,
    "host": "http://localhost:1234",
    "message": "LM Studio est accessible. 1 modèle(s) disponible(s).",
    "models_loaded": 1
  }
}
```

### 2. Ouvrir une page web

```bash
curl -X POST http://localhost:8000/browser/open \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_SECRET_ICI" \
  -d '{
    "url": "https://example.com",
    "wait_time": 2.0
  }'
```

**Réponse** :

```json
{
  "url": "https://example.com/",
  "title": "Example Domain",
  "html_preview": "<!doctype html>\n<html>\n<head>\n    <title>Example Domain</title>...",
  "timestamp": "2025-01-22T10:30:00",
  "success": true
}
```

### 3. Récupérer le HTML de la page

```bash
curl http://localhost:8000/browser/get_html \
  -H "Authorization: Bearer VOTRE_TOKEN_SECRET_ICI"
```

### 4. Cliquer sur un élément

```bash
curl -X POST http://localhost:8000/browser/click \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_SECRET_ICI" \
  -d '{
    "selector": "#login-button",
    "wait_after": 1.0
  }'
```

### 5. Prendre une capture d'écran

```bash
curl -X POST http://localhost:8000/browser/screenshot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_SECRET_ICI" \
  -d '{
    "full_page": false
  }'
```

**Réponse** :

```json
{
  "filename": "screenshot_20250122_103000.png",
  "filepath": "logs/screenshot_20250122_103000.png",
  "base64_image": "iVBORw0KGgoAAAANSUhEUgAA...",
  "timestamp": "2025-01-22T10:30:00",
  "success": true
}
```

### 6. Interroger LM Studio

```bash
curl -X POST http://localhost:8000/lm/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_SECRET_ICI" \
  -d '{
    "prompt": "Explique-moi ce qu'\''est le Model Context Protocol (MCP)",
    "temperature": 0.7,
    "max_tokens": 500
  }'
```

**Réponse** :

```json
{
  "response": "Le Model Context Protocol (MCP) est un protocole standardisé...",
  "model": "granite-3.0-2b-instruct",
  "tokens_used": 245,
  "temperature": 0.7,
  "timestamp": "2025-01-22T10:30:00",
  "success": true
}
```

### 7. Liste des modèles LM Studio

```bash
curl http://localhost:8000/lm/models \
  -H "Authorization: Bearer VOTRE_TOKEN_SECRET_ICI"
```

### 8. Historique des interactions

```bash
curl http://localhost:8000/memory/history \
  -H "Authorization: Bearer VOTRE_TOKEN_SECRET_ICI"
```

**Réponse** :

```json
{
  "total_interactions": 3,
  "interactions": [
    {
      "timestamp": "2025-01-22T10:25:00",
      "action": "open",
      "details": {"url": "https://example.com"},
      "success": true
    },
    {
      "timestamp": "2025-01-22T10:26:00",
      "action": "screenshot",
      "details": {"filename": "screenshot_20250122_102600.png"},
      "success": true
    },
    {
      "timestamp": "2025-01-22T10:27:00",
      "action": "get_html",
      "details": {"url": "https://example.com/"},
      "success": true
    }
  ]
}
```

## 🔐 Sécurité

### Authentification

Toutes les routes nécessitent un header `Authorization` :

```
Authorization: Bearer VOTRE_TOKEN_SECRET_ICI
```

⚠️ **Important** : Changez le token par défaut dans `config.json` !

### Logs

Tous les événements sont enregistrés dans `logs/server.log` :

```
2025-01-22 10:25:00 - INFO - 📖 Ouverture de l'URL: https://example.com
2025-01-22 10:26:00 - INFO - 📸 Capture d'écran: auto
2025-01-22 10:27:00 - INFO - 🤖 Requête LM Studio: Explique-moi...
```

## 🔧 Configuration Avancée

### Choisir le moteur de navigateur

Dans `config.json` :

```json
{
  "browser_engine": "playwright"  // ou "pywebview"
}
```

**Recommandé** : `playwright` (plus stable, plus de fonctionnalités)

### Configuration LM Studio

Si LM Studio utilise un port différent :

```json
{
  "lmstudio": {
    "host": "http://localhost:5000",
    "model": "granite-3.0-2b-instruct"
  }
}
```

## 🤝 Intégration avec Claude / GPT / Gemini

### Avec Claude Desktop (MCP)

Ajoutez dans `claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "mcp_browser_lmstudio": {
      "command": "python",
      "args": ["/chemin/vers/MCP_Browser_LMStudio/app.py"]
    }
  }
}
```

### Avec Claude Code / API

Claude peut appeler directement les endpoints HTTP :

```python
# Exemple d'utilisation depuis Claude Code
import httpx

async with httpx.AsyncClient() as client:
    # Ouvrir une page
    response = await client.post(
        "http://localhost:8000/browser/open",
        json={"url": "https://example.com"},
        headers={"Authorization": "Bearer VOTRE_TOKEN"}
    )

    # Récupérer le HTML
    html_response = await client.get(
        "http://localhost:8000/browser/get_html",
        headers={"Authorization": "Bearer VOTRE_TOKEN"}
    )

    # Interroger LM Studio
    lm_response = await client.post(
        "http://localhost:8000/lm/query",
        json={"prompt": "Analyse cette page: " + html_response.json()["html"]},
        headers={"Authorization": "Bearer VOTRE_TOKEN"}
    )
```

## 📚 Documentation API

Accédez à la documentation interactive Swagger :

```
http://localhost:8000/docs
```

Ou ReDoc :

```
http://localhost:8000/redoc
```

## 🐛 Dépannage

### LM Studio n'est pas accessible

**Erreur** : `LM Studio n'est pas accessible`

**Solutions** :
1. Vérifiez que LM Studio est lancé
2. Allez dans l'onglet **Developer** → **Start Server**
3. Vérifiez le port dans `config.json` (par défaut: 1234)

### Playwright ne fonctionne pas

**Erreur** : `Playwright is not installed`

**Solution** :

```bash
playwright install chromium
```

### Erreur d'authentification

**Erreur** : `401 Unauthorized`

**Solution** : Vérifiez que vous utilisez le bon token :

```bash
curl ... -H "Authorization: Bearer VOTRE_TOKEN_SECRET_ICI"
```

### Port déjà utilisé

**Erreur** : `Address already in use`

**Solution** : Changez le port dans `config.json` :

```json
{
  "server": {
    "port": 8001
  }
}
```

## 🔄 Workflow Recommandé

1. **Démarrer LM Studio** et charger un modèle
2. **Lancer le serveur MCP** : `python app.py`
3. **Vérifier le statut** : `curl http://localhost:8000/status`
4. **Ouvrir une page** via `/browser/open`
5. **Récupérer le HTML** via `/browser/get_html`
6. **Interroger LM Studio** avec le HTML : `/lm/query`
7. **Consulter l'historique** : `/memory/history`

## 📝 Notes de Développement

### Architecture

- **FastAPI** : Serveur HTTP asynchrone
- **Playwright** : Contrôle du navigateur (recommandé)
- **PyWebView** : Alternative légère (limitée)
- **LM Studio Client** : Basé sur la doc officielle (`/api/v0/chat/completions`)
- **Pydantic** : Validation des données

### Endpoints LM Studio

Conformément à la [documentation officielle](https://lmstudio.ai/docs/developer/rest/endpoints) :

- ✅ `POST /api/v0/chat/completions` (utilisé)
- ✅ `GET /api/v0/models` (utilisé)
- ⚠️ `/v1/*` endpoints (compatibilité OpenAI) non utilisés

## 📄 Licence

Ce projet fait partie de l'écosystème **Skynet**.

## 🙏 Crédits

- **LM Studio** : https://lmstudio.ai
- **FastAPI** : https://fastapi.tiangolo.com
- **Playwright** : https://playwright.dev
- **Model Context Protocol (MCP)** : Anthropic

---

**Développé avec 🟣 pour l'écosystème Skynet**
