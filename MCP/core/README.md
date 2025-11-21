# 🧠 MCP Obsidian Core — Markdown Cognitive Process

## 📋 Vue d'ensemble

**MCP Obsidian Core** est une infrastructure avancée permettant à plusieurs agents IA (Claude, GPT, Gemini, etc.) d'utiliser des dossiers Markdown comme **mémoire vivante** et **interface de commande**.

Chaque agent dispose d'un "cerveau" structuré en Markdown, surveillé en temps réel par un système de watcher intelligent qui déclenche des actions automatiques.

---

## 🏗️ Architecture Globale

```
/MCP/
├── Claude/          # Agent Claude
├── Gemini/          # Agent Gemini
├── GPT/             # Agent GPT
└── core/            # Infrastructure centrale
    ├── watcher/     # Surveillance temps réel
    ├── n8n_connector/ # Intégration n8n
    └── README.md    # Ce fichier
```

---

## 📁 Structure d'un Agent

Chaque agent (Claude, Gemini, GPT) possède la structure suivante :

```
Agent/
├── directives.md    # Rôle, contraintes, instructions permanentes
├── context.md       # Contexte de fond chargé à chaque cycle
├── tasks.md         # Liste de tâches avec marquage automatique
├── memory/          # Journaux, logs, résumés, sessions
│   ├── journal_YYYY-MM-DD.md
│   └── log_raw/
├── rag/             # Extraits importants, vectorisation
│   ├── chunks/
│   └── rag_index.json
├── output/          # Résultats produits par l'IA
└── sync/            # Pipeline n8n / Drive / API
```

### 📄 Fichiers Principaux

#### `directives.md`
Contient les **règles permanentes** de l'agent :
- Rôle et mission
- Contraintes à respecter
- Style de communication
- Protocoles de décision

#### `context.md`
Stocke le **contexte stable** :
- Informations de fond
- État actuel du projet
- Références importantes
- Environnement de travail

#### `tasks.md`
Gère les **tâches** avec marquage automatique :
```markdown
- [ ] Tâche en attente
- [x] Tâche complétée — Fait le 2025-11-21 14:30
```

#### `memory/`
Archive les **interactions** :
- Journaux quotidiens
- Logs bruts
- Résumés de sessions
- Historique des décisions

#### `rag/`
Système de **récupération** :
- Chunks de texte indexés
- Index JSON pour recherche rapide
- Extraits importants

#### `output/`
Contient les **productions** :
- Fichiers générés
- Résultats d'analyses
- Rapports créés

---

## 🔧 Infrastructure Core

### 1️⃣ Watcher (`watcher.py`)

Le **watcher** surveille en temps réel les modifications de fichiers Markdown et déclenche des actions automatiques.

**Fonctionnalités** :
- Détection de modifications (`.md` ajoutés/modifiés/supprimés)
- Parsing automatique des directives, contexte et tâches
- Génération d'événements uniformes
- Déclenchement du dispatcher
- Écriture automatique des logs

**Événement généré** :
```json
{
  "agent": "Claude",
  "file": "tasks.md",
  "event": "modified",
  "timestamp": "2025-11-21T14:30:00",
  "content": "..."
}
```

**Lancement** :
```bash
cd MCP/core/watcher
python watcher.py
```

### 2️⃣ Dispatcher (`dispatcher.py`)

Le **dispatcher** traite les événements et orchestre les actions des agents.

**Workflow** :
1. Recevoir un événement du watcher
2. Charger `directives.md` + `context.md`
3. Analyser le type d'action requise
4. Décider du traitement :
   - Traiter une tâche
   - Mettre à jour la mémoire
   - Générer un résumé
   - Déclencher n8n
5. Exécuter l'action
6. Logger le résultat

**Exemple** :
```python
# Si tasks.md contient "[ ] Compiler le script X"
# Le dispatcher envoie à l'IA :
prompt = f"""
Voici la tâche : Compiler le script X
Voici le contexte : {context.md}
Voici tes directives : {directives.md}
Agis.
"""
```

### 3️⃣ RAG Simple (`rag_manager.py`)

Système de **récupération augmentée** simple mais efficace.

**Fonctionnalités** :
- Découpage des `.md` en blocs (chunks)
- Stockage dans `chunks/chunk_001.md`, etc.
- Index JSON simple : `rag_index.json`
- Fonction `search(term)` pour retrouver les chunks pertinents
- MVP : recherche mot-clé (pas d'embeddings requis)

**Structure RAG** :
```
rag/
├── chunks/
│   ├── chunk_001.md
│   ├── chunk_002.md
│   └── ...
└── rag_index.json
```

**Index JSON** :
```json
{
  "chunks": [
    {
      "id": "001",
      "source": "context.md",
      "keywords": ["projet", "mission", "objectif"],
      "content": "..."
    }
  ]
}
```

### 4️⃣ N8N Connector

Intégration avec **n8n** pour l'automatisation et la synchronisation.

**Pipeline** :
1. Watch → Surveiller les `.md`
2. Push → Envoyer vers Google Drive
3. Notify → Email / Telegram
4. Pull → Mise à jour locale depuis Drive

**Fichiers** :
- `flow.json` : Template n8n pré-configuré
- `webhook.py` : Endpoint pour recevoir/envoyer des données

### 5️⃣ Configuration (`rules.json`)

Règles de comportement pour le watcher et le dispatcher.

**Exemple** :
```json
{
  "agents": ["Claude", "Gemini", "GPT"],
  "watch_extensions": [".md"],
  "auto_actions": {
    "tasks_modified": "dispatch_task_check",
    "directives_modified": "reload_agent_config",
    "context_modified": "update_agent_context"
  },
  "logging": {
    "level": "INFO",
    "format": "json",
    "destination": "memory/log_raw/"
  }
}
```

---

## 🤖 Comportement Intelligent des Agents

### Cycle de Vie d'un Agent

À chaque cycle, l'agent doit :

1. **Lire** `directives.md` (règles permanentes)
2. **Lire** `context.md` (contexte actuel)
3. **Lire** `tasks.md` (tâches à effectuer)
4. **Écrire** dans `memory/journal_YYYY-MM-DD.md` (log de l'action)
5. **Mettre à jour** `output/` si une tâche est résolue
6. **Mettre à jour** `rag/` si un fichier important change

### Traitement Automatique des Tâches

Quand l'agent détecte :
```markdown
- [ ] Tâche X
```

Il doit :
1. **Traiter** la tâche
2. **Marquer** comme complétée :
```markdown
- [x] Tâche X — Fait le 2025-11-21 14:30
```
3. **Logger** dans `memory/journal_YYYY-MM-DD.md`

### Logs Intelligents

Chaque action génère un log structuré :

```markdown
## 2025-11-21 14:30:00 — Action IA

**Type** : Traitement de tâche
**Fichier affecté** : tasks.md
**Résumé** : Compilation du script X réussie
**Nouvelle mémoire** : Script X compilé avec succès, 0 erreurs
**Sortie** : output/script_x_compiled.log
```

---

## 🚀 Installation et Démarrage

### Prérequis

```bash
Python 3.9+
Node.js 18+ (optionnel pour n8n)
```

### Installation

```bash
# Installer les dépendances Python
cd MCP/core/watcher
pip install -r requirements.txt

# Installer n8n (optionnel)
npm install -g n8n
```

### Démarrage

```bash
# Lancer le watcher
cd MCP/core/watcher
python watcher.py

# Dans un autre terminal, lancer le dispatcher
python dispatcher.py

# (Optionnel) Lancer n8n
n8n start
```

---

## 📊 Flux de Données

```
┌─────────────┐
│   Agent     │
│  Markdown   │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌─────────────┐
│   Watcher   │─────▶│ Dispatcher  │
│  (watchdog) │      │  (actions)  │
└─────────────┘      └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │   Actions   │
                     ├─────────────┤
                     │ • Task exec │
                     │ • Memory    │
                     │ • RAG       │
                     │ • n8n sync  │
                     └─────────────┘
```

---

## 🔐 Sécurité et Bonnes Pratiques

1. **Ne jamais commiter** de secrets dans les fichiers Markdown
2. **Utiliser** `.gitignore` pour exclure `memory/log_raw/`
3. **Valider** toutes les entrées avant exécution
4. **Limiter** les permissions d'écriture du watcher
5. **Chiffrer** les données sensibles dans `sync/`

---

## 🛠️ Développement et Extension

### Ajouter un Nouvel Agent

```bash
# Copier la structure d'un agent existant
cp -r MCP/Claude MCP/NewAgent

# Modifier les fichiers
vim MCP/NewAgent/directives.md
vim MCP/NewAgent/context.md

# Ajouter l'agent dans rules.json
```

### Ajouter une Nouvelle Action

Dans `dispatcher.py` :
```python
def handle_custom_action(event):
    # Votre logique personnalisée
    pass

# Enregistrer l'action
action_handlers['custom_action'] = handle_custom_action
```

---

## 📚 Ressources

- **Watchdog** : https://pypi.org/project/watchdog/
- **n8n** : https://n8n.io/
- **Markdown** : https://commonmark.org/

---

## 🤝 Contribution

Pour contribuer :
1. Fork le repository
2. Créer une branche feature
3. Commit les changements
4. Push et créer une Pull Request

---

## 📝 Licence

MIT License - Voir LICENSE pour plus de détails

---

## 🎯 Roadmap

- [ ] Ajouter des embeddings pour le RAG
- [ ] Interface web Obsidian-like
- [ ] Support de langages supplémentaires
- [ ] Intégration Telegram/Discord
- [ ] Dashboard de monitoring
- [ ] Tests unitaires complets
- [ ] Documentation API complète

---

**Créé avec 🧠 par Claude Code**
