# 🧠 Local LLM MCP - Assistant IA Local

**Serveur MCP pour interagir avec des modèles IA locaux**

Support pour :
- 🦙 **Ollama** - Modèles locaux optimisés
- 🎨 **LM Studio** - Interface OpenAI-compatible
- 🤖 **GPT4All** - Modèles locaux légers
- 🌐 **Qwen** - Modèles Qwen en mode serveur

---

## 🎯 Fonctionnalités

✅ **6 tools MCP** pour interagir avec des LLM locaux
✅ **Multi-backend** - Support Ollama, LM Studio, GPT4All, Qwen
✅ **Détection automatique** - Vérifie les backends disponibles
✅ **Fallback intelligent** - Bascule automatique si un backend échoue
✅ **Paramètres ajustables** - Temperature, top_p, max_tokens
✅ **Mode chat** - Conversations multi-tours
✅ **Sécurisé** - Sandbox texte uniquement, pas d'exécution shell

---

## 📋 Tools disponibles

| Tool | Description |
|------|-------------|
| `llm_list_models` | Liste tous les modèles disponibles |
| `llm_run_inference` | Exécute une génération de texte |
| `llm_chat` | Conversation avec le modèle |
| `llm_model_info` | Informations sur un modèle |
| `llm_set_backend` | Change le backend (ollama/lmstudio) |
| `llm_get_backend` | Retourne le backend courant |

---

## 🔧 Prérequis

### Obligatoires
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### Au moins un backend installé
- **Ollama** : https://ollama.ai/download
- **LM Studio** : https://lmstudio.ai/
- **GPT4All** : https://gpt4all.io/
- **Qwen** : Mode serveur local

---

## 📦 Installation

```bash
# Cloner/télécharger le projet
cd local_llm_mcp

# Installer les dépendances
npm install

# Compiler TypeScript
npm run build

# Configurer l'environnement
cp .env.example .env
nano .env  # Éditer les URLs des backends
```

### Configuration `.env`

```bash
MCP_PORT=3200
OLLAMA_URL=http://localhost:11434
LMSTUDIO_URL=http://localhost:1234
DEFAULT_BACKEND=ollama
```

---

## 🚀 Utilisation

### Démarrer le serveur

```bash
# Mode production
npm start

# Mode développement
npm run dev
```

### Health check

```bash
curl http://localhost:3200/health
```

### Connexion à Claude Code CLI

```bash
# Méthode stdio (recommandé)
claude mcp add llm-assistant stdio node /path/to/local_llm_mcp/dist/server.js

# Méthode HTTP
npm start  # Dans un terminal
claude mcp add llm-assistant http://localhost:3200  # Dans un autre
```

---

## 💡 Exemples d'utilisation

### Lister les modèles

```json
{
  "name": "llm_list_models",
  "arguments": {
    "backend": "ollama"
  }
}
```

**Résultat** :
```json
{
  "success": true,
  "data": [
    { "name": "llama2:7b", "size": 3826793000 },
    { "name": "mistral:latest", "size": 4109860000 }
  ]
}
```

### Génération de texte

```json
{
  "name": "llm_run_inference",
  "arguments": {
    "model": "llama2:7b",
    "prompt": "Explique moi la différence entre Docker et une VM",
    "temperature": 0.7,
    "max_tokens": 500
  }
}
```

### Conversation

```json
{
  "name": "llm_chat",
  "arguments": {
    "model": "llama2:7b",
    "messages": [
      { "role": "system", "content": "Tu es un assistant technique expert." },
      { "role": "user", "content": "Comment créer un serveur Express.js ?" }
    ],
    "temperature": 0.8
  }
}
```

### Changer de backend

```json
{
  "name": "llm_set_backend",
  "arguments": {
    "backend": "lmstudio"
  }
}
```

---

## 🔄 Workflows typiques

### Workflow 1 : Première utilisation

```bash
1. llm_get_backend → Vérifier le backend courant
2. llm_list_models → Lister les modèles disponibles
3. llm_run_inference → Tester avec un modèle
```

### Workflow 2 : Conversation multi-tours

```bash
1. llm_chat → Premier message
2. llm_chat → Continuer la conversation (avec historique)
3. llm_chat → Question de suivi
```

### Workflow 3 : Fallback

```bash
1. llm_set_backend → "ollama"
2. llm_run_inference → Si échoue (Ollama offline)
3. llm_set_backend → "lmstudio"
4. llm_run_inference → Retry avec LM Studio
```

---

## 🐛 Dépannage

### Ollama ne répond pas

**Problème** : `Connection refused`

**Solutions** :
```bash
# Vérifier qu'Ollama tourne
ollama list

# Démarrer Ollama
ollama serve

# Tester l'API
curl http://localhost:11434/api/tags
```

### LM Studio ne répond pas

**Problème** : `ECONNREFUSED`

**Solutions** :
1. Ouvrir LM Studio
2. Aller dans "Local Server"
3. Cliquer sur "Start Server"
4. Vérifier le port (défaut: 1234)

### Modèle introuvable

**Problème** : `model not found`

**Solutions** :
```bash
# Pour Ollama
ollama pull llama2:7b

# Pour LM Studio
# Télécharger le modèle via l'interface
```

---

## 🔒 Sécurité

✅ **Sandbox texte** - Pas d'accès fichiers
✅ **Pas d'exécution shell** - Aucune commande système
✅ **Limite de taille** - Prompts limités à 50KB
✅ **Timeout** - 120s par défaut
✅ **Validation inputs** - Schemas stricts

**Sûr pour** :
- Génération de texte
- Conversations
- Assistance au code
- Résumés

**Non prévu pour** :
- Exécution de code
- Accès fichiers
- Opérations système

---

## 🚀 Roadmap & Améliorations

### Version 1.1 (Court terme)
- [ ] Support GPT4All complet
- [ ] Support Qwen local
- [ ] Streaming SSE pour réponses
- [ ] Cache des réponses
- [ ] Historique des conversations

### Version 1.2 (Moyen terme)
- [ ] Multi-backend simultané
- [ ] Load balancing automatique
- [ ] Embeddings locaux
- [ ] RAG local avec vector DB
- [ ] Fine-tuning local

### Version 2.0 (Long terme)
- [ ] Interface graphique web
- [ ] API REST complète
- [ ] Système de plugins
- [ ] Modèles spécialisés (code, math, etc.)
- [ ] Accélération GPU avancée

---

## 📊 Architecture

```
┌──────────────────────────────────────────┐
│         CLAUDE CODE CLI                  │
└───────────────┬──────────────────────────┘
                │ MCP Protocol
                ▼
┌──────────────────────────────────────────┐
│    LOCAL LLM MCP SERVER (Port 3200)      │
├──────────────────────────────────────────┤
│  Backend Manager | Tools Registry         │
└──────────────────────────────────────────┘
        │       │       │       │
    ┌───┴──┬────┴──┬────┴──┬────┴──┐
    ▼      ▼       ▼       ▼       ▼
 Ollama  LMStudio  Qwen  GPT4All  [Autres]
:11434   :1234   :8000  :4891
```

---

## 📝 Licence

MIT License

---

## 🙏 Remerciements

- [Ollama](https://ollama.ai) - Modèles locaux optimisés
- [LM Studio](https://lmstudio.ai) - Interface conviviale
- [GPT4All](https://gpt4all.io) - Modèles open-source
- [Anthropic](https://anthropic.com) - Model Context Protocol

---

**Créé avec ❤️ par Skynet AI Assistant**
**Version** : 1.0.0
