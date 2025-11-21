# 🧠 MCP Obsidian Core

## Markdown Cognitive Process — Multi-Agent Intelligence System

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-repo/mcp-obsidian-core)
[![Python](https://img.shields.io/badge/python-3.9+-green.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)

---

## 🎯 Vue d'ensemble

**MCP Obsidian Core** est une infrastructure avancée permettant à plusieurs agents IA (Claude, GPT, Gemini, etc.) d'utiliser des dossiers Markdown comme **mémoire vivante** et **interface de commande**.

Chaque agent dispose d'un "cerveau" structuré en Markdown, surveillé en temps réel par un système intelligent qui déclenche des actions automatiques.

### ✨ Caractéristiques Principales

- 🔍 **Surveillance temps réel** : Détection automatique des modifications Markdown
- 🤖 **Multi-agents** : Support de plusieurs IA (Claude, Gemini, GPT)
- 📝 **Mémoire persistante** : Journaux, logs, contexte sauvegardés
- 🔎 **RAG simple** : Système de recherche et récupération d'informations
- 🔗 **Intégration n8n** : Synchronisation automatique (Drive, Slack, etc.)
- 🎯 **Gestion de tâches** : Marquage automatique des tâches complétées
- 📊 **Logs structurés** : Traçabilité complète de toutes les actions

---

## 📁 Structure

```
MCP/
├── Claude/              # Agent Claude
│   ├── directives.md    # Règles permanentes
│   ├── context.md       # Contexte actuel
│   ├── tasks.md         # Tâches à effectuer
│   ├── memory/          # Journaux et logs
│   ├── rag/             # Base de connaissances
│   ├── output/          # Productions
│   └── sync/            # Synchronisation
│
├── Gemini/              # Agent Gemini (même structure)
├── GPT/                 # Agent GPT (même structure)
│
└── core/                # Infrastructure centrale
    ├── watcher/         # Surveillance temps réel
    │   ├── watcher.py   # Détection des modifications
    │   ├── dispatcher.py # Traitement des événements
    │   ├── rag_manager.py # Système RAG
    │   └── rules.json   # Configuration
    │
    └── n8n_connector/   # Intégration n8n
        ├── flow.json    # Template workflow
        └── webhook.py   # Connecteur Python
```

---

## 🚀 Démarrage Rapide

### Installation

```bash
# Cloner le repository
git clone https://github.com/your-repo/MCP-Obsidian-Core.git
cd MCP-Obsidian-Core

# Installation automatique
bash setup.sh
```

### Lancement

```bash
# Terminal 1 - Watcher
cd MCP/core/watcher
python3 watcher.py

# Terminal 2 - Dispatcher
cd MCP/core/watcher
python3 dispatcher.py --watch
```

**✅ Système opérationnel !**

Pour plus de détails : [QUICKSTART.md](QUICKSTART.md)

---

## 📚 Documentation

- 📖 [Installation Complète](INSTALL.md)
- 🚀 [Guide de Démarrage Rapide](QUICKSTART.md)
- 🏗️ [Architecture Détaillée](core/README.md)
- 🔗 [Configuration n8n](core/n8n_connector/README.md)

---

## 🎯 Cas d'Usage

### 1. Gestion Automatique de Tâches

```markdown
# Dans tasks.md
- [ ] Créer un script de backup

→ Le watcher détecte
→ Le dispatcher traite
→ Action loggée dans memory/
```

### 2. Mémoire Persistante

Tous les événements sont automatiquement enregistrés :
- Modifications de fichiers
- Actions des agents
- Résultats produits
- Décisions prises

### 3. Recherche Intelligente (RAG)

```bash
# Indexer des fichiers
python3 rag_manager.py Claude index context.md

# Rechercher
python3 rag_manager.py Claude search "infrastructure"
```

### 4. Synchronisation Automatique

Via n8n :
- Backup sur Google Drive
- Notifications Slack
- Webhooks personnalisés

---

## 🧪 Exemple Complet

### Scénario : Traitement d'une tâche

**1. Ajouter une tâche** dans `Claude/tasks.md` :
```markdown
- [ ] Analyser les logs du serveur
```

**2. Le système réagit automatiquement** :
- ✅ Watcher détecte la modification
- ✅ Dispatcher charge directives + context
- ✅ Événement loggé dans `memory/journal_YYYY-MM-DD.md`
- ✅ RAG indexe la nouvelle information
- ✅ (Optionnel) n8n envoie une notification

**3. Une fois complétée** :
```markdown
- [x] Analyser les logs du serveur — Fait le 2025-11-21 15:30
```

---

## 🛠️ Technologies

### Backend
- **Python 3.9+** : Langage principal
- **watchdog** : Surveillance fichiers
- **requests** : HTTP pour webhooks

### Automatisation
- **n8n** : Workflows d'automatisation
- **webhooks** : Intégrations externes

### Storage
- **Markdown** : Format universel
- **JSON** : Index et métadonnées
- **File System** : Backend simple

---

## 🔧 Configuration

### Personnaliser un Agent

Éditer les fichiers Markdown :

**`directives.md`** : Règles et comportement
```markdown
## Rôle
Tu es un assistant spécialisé en...

## Règles
- Toujours documenter
- Privilégier la sécurité
```

**`context.md`** : Contexte et mission
```markdown
## Mission Actuelle
Développer le module X...
```

**`tasks.md`** : Tâches à effectuer
```markdown
- [ ] Implémenter la fonctionnalité Y
- [ ] Écrire les tests
```

### Configurer les Règles

`core/watcher/rules.json` :
```json
{
  "n8n": {
    "enabled": true,
    "webhook_url": "http://localhost:5678/webhook/mcp-webhook"
  },
  "rag": {
    "chunk_size": 500,
    "auto_index": true
  }
}
```

---

## 📊 Monitoring

### Logs Temps Réel

```bash
# Watcher
tail -f MCP/core/watcher/watcher.log

# Dispatcher
tail -f MCP/core/watcher/dispatcher.log

# Agent
tail -f MCP/Claude/memory/journal_$(date +%Y-%m-%d).md
```

### Statistiques RAG

```bash
python3 rag_manager.py Claude stats
```

---

## 🔐 Sécurité

- ✅ Validation des entrées
- ✅ Sanitization des chemins
- ✅ Limite de taille de fichiers
- ✅ Pas de secrets dans les fichiers
- ✅ Logs sécurisés

---

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 🗺️ Roadmap

- [x] Infrastructure core
- [x] Watcher temps réel
- [x] Dispatcher intelligent
- [x] RAG simple
- [x] Intégration n8n
- [ ] Embeddings avancés pour RAG
- [ ] Interface web Obsidian-like
- [ ] Support multi-langues
- [ ] Tests unitaires complets
- [ ] Dashboard de monitoring
- [ ] API REST
- [ ] Docker compose
- [ ] Intégration CI/CD

---

## 📝 Licence

MIT License - Voir [LICENSE](LICENSE) pour plus de détails

---

## 🙏 Remerciements

- [Watchdog](https://github.com/gorakhargosh/watchdog) - File system monitoring
- [n8n](https://n8n.io/) - Workflow automation
- [Obsidian](https://obsidian.md/) - Inspiration pour l'organisation Markdown

---

## 📬 Contact

- **Issues** : [GitHub Issues](https://github.com/your-repo/mcp-obsidian-core/issues)
- **Discussions** : [GitHub Discussions](https://github.com/your-repo/mcp-obsidian-core/discussions)

---

## ⭐ Star History

Si ce projet vous est utile, n'hésitez pas à lui donner une étoile ⭐

---

<p align="center">
  <b>Créé avec 🧠 pour l'intelligence artificielle collaborative</b>
</p>

<p align="center">
  <i>MCP Obsidian Core — Transformez Markdown en mémoire intelligente</i>
</p>
