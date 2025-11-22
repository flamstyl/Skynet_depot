# 🛰️ Skynet FileWatcher MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0-blue)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Un serveur **Model Context Protocol (MCP)** professionnel pour surveiller les changements de fichiers en temps réel et logger tous les événements dans un format JSON normalisé.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Outils MCP disponibles](#outils-mcp-disponibles)
- [Format des événements](#format-des-événements)
- [Intégration avec Claude Code](#intégration-avec-claude-code)
- [Tests et débogage](#tests-et-débogage)
- [Cas d'usage](#cas-dusage)
- [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

**Skynet FileWatcher MCP** est conçu pour fournir à Claude Code (et autres clients MCP) une conscience en temps réel des changements de fichiers dans vos projets. C'est un outil essentiel pour :

- 🔍 **Surveillance automatique** : Détecte création, modification, suppression et renommage de fichiers
- 📊 **Logging structuré** : Tous les événements sont enregistrés en JSON avec timestamps et métadonnées
- 🚀 **Performance optimale** : Utilise `chokidar` v4 pour une surveillance efficace et légère
- 🧠 **IA-friendly** : Exposé via MCP pour permettre à Claude de comprendre l'évolution de votre codebase
- 🔐 **Hash SHA-256** : Calcul optionnel de hash pour détecter les modifications réelles

---

## ✨ Fonctionnalités

### Détection d'événements

- ✅ **Création de fichiers** (`created`)
- ✅ **Modification de fichiers** (`modified`)
- ✅ **Suppression de fichiers** (`deleted`)
- ✅ **Renommage de fichiers** (`renamed`) - détection heuristique
- ✅ **Création/suppression de dossiers**

### Logging avancé

- 📝 Format **JSONL** (JSON Lines) pour lecture efficace
- 🆔 **UUID unique** pour chaque événement
- ⏰ **Timestamps ISO 8601**
- 📏 **Taille avant/après** pour les modifications
- 🔐 **Hash SHA-256** optionnel pour vérifier l'intégrité

### Outils MCP

- 🔎 `detect_changes` - Récupère les événements avec filtres avancés
- 📊 `get_watch_status` - Statut en temps réel du watcher
- 📈 `get_event_stats` - Statistiques détaillées sur les événements
- 🧹 `clean_old_events` - Nettoyage automatique des vieux logs
- 🔍 `search_events` - Recherche avancée multi-critères

---

## 🏗️ Architecture

```
skynet-filewatcher-mcp/
│
├── index.js                 # Serveur MCP principal
├── package.json            # Dépendances et scripts
├── config.json             # Configuration du watcher
│
├── tools/
│   ├── filewatcher.js      # Logique de surveillance (chokidar)
│   └── utils.js            # Utilitaires (hash, lecture logs, stats)
│
└── logs/
    └── events.jsonl        # Fichier de log des événements
```

### Stack technique

- **MCP SDK** : `@modelcontextprotocol/sdk` (officiel Anthropic)
- **File Watcher** : `chokidar` v4 (haute performance, cross-platform)
- **Validation** : `zod` (schema validation)
- **UUID** : `uuid` v11 (génération d'identifiants uniques)
- **Hash** : `crypto` (SHA-256 natif Node.js)

---

## 📦 Installation

### Prérequis

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0

### Installation rapide

```bash
# Cloner ou copier le projet
cd skynet-filewatcher-mcp

# Installer les dépendances
npm install

# Vérifier l'installation
npm start
```

### Installation globale (optionnel)

```bash
# Installer globalement pour utiliser partout
npm install -g .

# Lancer depuis n'importe où
skynet-filewatcher-mcp
```

---

## ⚙️ Configuration

Modifiez `config.json` pour personnaliser le comportement :

```json
{
  "watchPath": "/home/raphael/Skynet_Drive_Core/",
  "logPath": "./logs/events.jsonl",
  "options": {
    "persistent": true,
    "ignoreInitial": true,
    "awaitWriteFinish": {
      "stabilityThreshold": 2000,
      "pollInterval": 100
    },
    "ignored": [
      "**/node_modules/**",
      "**/.git/**",
      "**/.DS_Store",
      "**/Thumbs.db",
      "**/*.tmp",
      "**/*.swp"
    ],
    "depth": 99
  },
  "features": {
    "calculateHash": true,
    "trackFileSize": true,
    "maxEventsInMemory": 10000
  }
}
```

### Paramètres importants

| Paramètre | Description | Valeur par défaut |
|-----------|-------------|-------------------|
| `watchPath` | Dossier à surveiller | `/home/raphael/Skynet_Drive_Core/` |
| `logPath` | Fichier de log JSONL | `./logs/events.jsonl` |
| `ignoreInitial` | Ignorer les fichiers existants au démarrage | `true` |
| `awaitWriteFinish` | Attendre la fin d'écriture avant de déclencher | `true` |
| `ignored` | Patterns à ignorer (glob) | `node_modules`, `.git`, etc. |
| `depth` | Profondeur de surveillance | `99` |
| `calculateHash` | Calculer le hash SHA-256 | `true` |

---

## 🚀 Utilisation

### Démarrage manuel

```bash
# Démarrer le serveur MCP
npm start

# Ou directement
node index.js
```

### Utilisation avec Claude Code CLI

Ajoutez le serveur à votre configuration Claude Code :

**Fichier : `~/.config/claude/mcp_config.json`** (ou équivalent)

```json
{
  "mcpServers": {
    "skynet-filewatcher": {
      "command": "node",
      "args": ["/chemin/vers/skynet-filewatcher-mcp/index.js"]
    }
  }
}
```

### Utilisation avec Claude Desktop (macOS/Windows)

**Fichier : `~/Library/Application Support/Claude/claude_desktop_config.json`**

```json
{
  "mcpServers": {
    "skynet-filewatcher": {
      "command": "node",
      "args": ["/Users/raphael/skynet-filewatcher-mcp/index.js"]
    }
  }
}
```

Redémarrez Claude Desktop pour charger le serveur.

---

## 🔧 Outils MCP disponibles

### 1. `detect_changes`

Récupère les événements de changement avec filtres avancés.

**Paramètres d'entrée :**

```json
{
  "since_timestamp": "2025-11-22T20:00:00Z",  // Optionnel
  "event_type": "modified",                    // Optionnel: created|modified|deleted|renamed
  "file_pattern": ".*\\.js$",                  // Optionnel: regex
  "limit": 100                                 // Optionnel: nombre max
}
```

**Exemple de sortie :**

```json
{
  "success": true,
  "count": 42,
  "events": [
    {
      "event_id": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2025-11-22T21:35:12.456Z",
      "event_type": "modified",
      "file_path": "/home/raphael/Skynet_Drive_Core/project/index.js",
      "old_size": null,
      "new_size": 2048,
      "hash_before": null,
      "hash_after": "sha256:abc123..."
    }
  ],
  "filters_applied": {
    "event_type": "modified"
  }
}
```

### 2. `get_watch_status`

Retourne le statut actuel du système de surveillance.

**Paramètres d'entrée :** Aucun

**Exemple de sortie :**

```json
{
  "success": true,
  "status": {
    "is_watching": true,
    "watch_path": "/home/raphael/Skynet_Drive_Core/",
    "log_path": "/home/user/skynet-filewatcher-mcp/logs/events.jsonl",
    "stats": {
      "started_at": "2025-11-22T20:00:00Z",
      "events_count": 1523,
      "files_created": 45,
      "files_modified": 1234,
      "files_deleted": 12,
      "files_renamed": 232
    },
    "features": {
      "calculateHash": true,
      "trackFileSize": true,
      "maxEventsInMemory": 10000
    }
  }
}
```

### 3. `get_event_stats`

Calcule des statistiques détaillées sur les événements.

**Paramètres d'entrée :**

```json
{
  "since_timestamp": "2025-11-22T00:00:00Z"  // Optionnel
}
```

**Exemple de sortie :**

```json
{
  "success": true,
  "stats": {
    "total": 1523,
    "by_type": {
      "created": 45,
      "modified": 1234,
      "deleted": 12,
      "renamed": 232
    },
    "date_range": {
      "oldest": "2025-11-20T08:00:00Z",
      "newest": "2025-11-22T21:35:12Z"
    },
    "total_size_changed": 15728640,
    "total_size_changed_formatted": "15 MB"
  },
  "period": "Tous les événements"
}
```

### 4. `clean_old_events`

Supprime les événements plus anciens qu'une durée spécifiée.

**Paramètres d'entrée :**

```json
{
  "max_age_hours": 24  // Défaut: 24h
}
```

**Exemple de sortie :**

```json
{
  "success": true,
  "removed_count": 342,
  "max_age_hours": 24,
  "message": "342 événement(s) supprimé(s)"
}
```

### 5. `search_events`

Recherche avancée avec multiples critères.

**Paramètres d'entrée :**

```json
{
  "query": "index.js",
  "event_types": ["created", "modified"],
  "start_date": "2025-11-22T00:00:00Z",
  "end_date": "2025-11-22T23:59:59Z",
  "limit": 50
}
```

---

## 📄 Format des événements

Chaque événement est enregistré dans `logs/events.jsonl` selon ce format :

```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-11-22T21:35:12.456Z",
  "event_type": "modified",
  "file_path": "/home/raphael/Skynet_Drive_Core/project/index.js",
  "old_size": 1024,
  "new_size": 2048,
  "hash_before": "sha256:abc123...",
  "hash_after": "sha256:def456...",
  "is_directory": false
}
```

### Champs

- **event_id** : UUID v4 unique
- **timestamp** : ISO 8601 (UTC)
- **event_type** : `created` | `modified` | `deleted` | `renamed`
- **file_path** : Chemin absolu du fichier
- **old_size** : Taille avant (octets) ou `null`
- **new_size** : Taille après (octets)
- **hash_before** : SHA-256 avant ou `null`
- **hash_after** : SHA-256 après ou `null`
- **is_directory** : `true` si c'est un dossier (optionnel)

---

## 🤖 Intégration avec Claude Code

### Exemple de prompts pour Claude

**Voir les derniers changements :**

```
Utilise l'outil detect_changes pour me montrer les 20 derniers événements de fichiers.
```

**Filtrer les modifications :**

```
Récupère tous les fichiers JavaScript modifiés depuis ce matin (2025-11-22T08:00:00Z).
```

**Statistiques :**

```
Montre-moi les statistiques d'activité de fichiers pour aujourd'hui.
```

**Nettoyer les logs :**

```
Supprime les événements plus vieux que 48 heures.
```

### Workflow automatisé

Claude peut maintenant :

1. **Détecter automatiquement** quand vous modifiez un fichier
2. **Analyser les changements** pour comprendre le contexte
3. **Proposer des actions** basées sur les modifications détectées
4. **Suivre l'évolution** de votre projet en temps réel

---

## 🧪 Tests et débogage

### Tester manuellement

```bash
# Terminal 1 : Démarrer le serveur
npm start

# Terminal 2 : Créer des fichiers de test
mkdir -p /tmp/test-watch
echo "test" > /tmp/test-watch/file1.txt
echo "modified" > /tmp/test-watch/file1.txt
rm /tmp/test-watch/file1.txt
```

Vérifiez les logs dans `logs/events.jsonl`.

### Utiliser l'inspecteur MCP

```bash
npm run inspect
```

Cela lance l'interface de débogage MCP officielle d'Anthropic.

### Vérifier les logs

```bash
# Voir les derniers événements
tail -f logs/events.jsonl

# Compter les événements
wc -l logs/events.jsonl

# Parser avec jq
cat logs/events.jsonl | jq -s '.[] | select(.event_type == "modified")'
```

---

## 💡 Cas d'usage

### 1. Administration système automatisée

Claude peut détecter quand vous installez un environnement de dev et proposer automatiquement des configurations optimales.

### 2. Synchronisation Drive

Surveiller un dossier Google Drive/Dropbox et notifier Claude des nouveaux fichiers pour analyse automatique.

### 3. CI/CD déclenché par IA

Claude détecte des modifications dans `package.json` et propose de lancer les tests ou rebuild.

### 4. Audit de sécurité

Détecter les modifications suspectes dans des fichiers critiques et alerter.

### 5. Backup automatique

Claude détecte des changements importants et propose de créer un snapshot Git.

---

## 🐛 Dépannage

### Problème : Le serveur ne démarre pas

**Solution :**

```bash
# Vérifier la version de Node.js
node --version  # Doit être >= 18.0.0

# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Problème : Aucun événement détecté

**Solution :**

1. Vérifiez que le `watchPath` existe et est accessible
2. Vérifiez les permissions (lecture/écriture)
3. Assurez-vous que les fichiers ne sont pas dans `ignored`

```bash
# Tester les permissions
ls -la /home/raphael/Skynet_Drive_Core/
```

### Problème : Trop d'événements / Performance

**Solution :**

1. Ajoutez plus de patterns dans `ignored`
2. Réduisez la `depth` de surveillance
3. Désactivez `calculateHash` si non nécessaire

```json
{
  "features": {
    "calculateHash": false
  }
}
```

### Problème : Hash toujours `null`

**Raisons possibles :**

- `calculateHash: false` dans la config
- Fichier supprimé avant le calcul du hash
- Permissions insuffisantes

---

## 🔗 Ressources

### Documentation MCP

- [Spécification MCP officielle](https://modelcontextprotocol.io/specification/2025-06-18)
- [SDK TypeScript](https://github.com/modelcontextprotocol/typescript-sdk)
- [Serveurs MCP de référence](https://github.com/modelcontextprotocol/servers)

### Bibliothèques utilisées

- [Chokidar](https://github.com/paulmillr/chokidar) - File watcher
- [Zod](https://github.com/colinhacks/zod) - Schema validation
- [UUID](https://www.npmjs.com/package/uuid) - UUID generation

### Skynet Project

- [GitHub Repository](https://github.com/flamstyl/Skynet_depot)
- [Documentation complète](https://github.com/flamstyl/Skynet_depot/tree/main/docs)

---

## 📝 Licence

MIT License - Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🙏 Contributions

Les contributions sont les bienvenues ! N'hésitez pas à :

- 🐛 Signaler des bugs via les [issues GitHub](https://github.com/flamstyl/Skynet_depot/issues)
- ✨ Proposer de nouvelles fonctionnalités
- 🔧 Soumettre des pull requests

---

## 📧 Contact

Pour toute question ou support :

- **GitHub** : [@flamstyl](https://github.com/flamstyl)
- **Project** : Skynet Depot

---

**Fait avec ❤️ pour Claude Code et la communauté Skynet**

*Ce MCP Server a été conçu par Claude Sonnet 4.5 pour Claude Code, créant ainsi une boucle de feedback parfaite pour l'amélioration continue de l'IA.*
