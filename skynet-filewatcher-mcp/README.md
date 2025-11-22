# 🔍 Skynet FileWatcher MCP

Un serveur MCP (Model Context Protocol) pour la surveillance en temps réel de fichiers et dossiers avec logs JSON structurés.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)

## 🎯 Vue d'ensemble

Skynet FileWatcher est un serveur MCP qui permet à Claude Code CLI de surveiller des dossiers en temps réel, détecter les changements de fichiers (création, modification, suppression), et générer des logs JSON normalisés pour intégration avec d'autres systèmes (n8n, Google Drive, moteurs de réflexion, etc.).

### ✨ Fonctionnalités principales

- 🔍 **Surveillance en temps réel** : Détection instantanée des changements via `chokidar`
- 📊 **Logs JSON structurés** : Format JSONL avec métadonnées complètes
- 🔐 **Calcul de hash** : SHA256/SHA1/MD5 pour détecter les modifications réelles
- 📁 **Multi-watchers** : Surveillance de plusieurs dossiers simultanément
- 🎯 **Filtrage avancé** : Patterns d'exclusion (node_modules, .git, etc.)
- 📈 **Statistiques** : Analyse des événements par type, période, etc.
- 💾 **Export** : JSON, JSONL, CSV pour intégration externe
- ⚡ **Performant** : Gestion optimisée de la mémoire et du stockage

## 🛠️ Outils MCP disponibles (10 tools)

### 🔧 Gestion des Watchers

| Outil | Description |
|-------|-------------|
| `start_watching` | Démarre la surveillance d'un dossier |
| `stop_watching` | Arrête un watcher spécifique |
| `list_watchers` | Liste tous les watchers actifs |
| `get_watcher` | Récupère les détails d'un watcher |
| `update_watcher` | Met à jour la configuration d'un watcher |

### 📊 Gestion des Événements

| Outil | Description |
|-------|-------------|
| `get_events` | Récupère les événements avec filtres (date, type, limit) |
| `get_event_stats` | Calcule des statistiques sur les événements |
| `export_events` | Exporte les événements (JSON, JSONL, CSV) |
| `clear_events` | Nettoie les événements avant une date |
| `get_file_hash` | Calcule le hash d'un fichier |

## 📦 Installation

### Prérequis

- **Node.js** 18+ (avec npm)
- **Linux/macOS** (Windows supporté mais non testé)
- **Claude Code CLI** configuré

### Installation rapide

```bash
# Cloner ou naviguer vers le dossier
cd skynet-filewatcher-mcp

# Installer les dépendances
npm install

# Compiler le TypeScript
npm run build

# Tester le serveur
npm run dev
```

### Installation automatique

```bash
# Utiliser le script d'installation
chmod +x install.sh
./install.sh
```

### Installation globale

```bash
# Installer globalement
npm install -g .

# Le serveur sera disponible via
skynet-filewatcher
```

## 🔧 Configuration pour Claude Code CLI

### Méthode 1 : Configuration manuelle

Éditez votre fichier `~/.config/claude/config.json` (ou équivalent selon votre OS) :

```json
{
  "mcp": {
    "servers": {
      "filewatcher": {
        "command": "node",
        "args": ["/chemin/absolu/vers/skynet-filewatcher-mcp/dist/index.js"]
      }
    }
  }
}
```

### Méthode 2 : Via CLI (si installé globalement)

```json
{
  "mcp": {
    "servers": {
      "filewatcher": {
        "command": "skynet-filewatcher"
      }
    }
  }
}
```

### Méthode 3 : Via commande Claude CLI

```bash
claude mcp add --transport stdio filewatcher node /chemin/vers/dist/index.js
```

## 📖 Utilisation

### Exemples avec Claude Code

Une fois le serveur MCP configuré, vous pouvez demander à Claude :

#### 1. Démarrer la surveillance d'un dossier

```
"Commence à surveiller le dossier /home/user/Documents/projets"
→ Claude utilise start_watching avec path: "/home/user/Documents/projets"
```

**Arguments :**
- `path` : Chemin du dossier à surveiller
- `recursive` : Surveiller récursivement (défaut: true)
- `ignorePatterns` : Patterns à ignorer (ex: ["*.log", "node_modules/**"])
- `calculateHash` : Calculer les hash (défaut: true)
- `hashAlgorithm` : sha256, sha1, ou md5 (défaut: sha256)

#### 2. Lister les watchers actifs

```
"Montre-moi tous les watchers actifs"
→ Claude utilise list_watchers
```

#### 3. Récupérer les événements récents

```
"Quels fichiers ont été modifiés dans les dernières 24 heures ?"
→ Claude utilise get_events avec since: "2025-11-21T00:00:00Z"
```

**Filtres disponibles :**
- `since` : Date de début (ISO 8601)
- `until` : Date de fin
- `event_type` : created, modified, deleted, renamed
- `watcher_id` : Filtrer par watcher
- `limit` : Nombre max de résultats (défaut: 100)

#### 4. Obtenir des statistiques

```
"Donne-moi des statistiques sur les événements du watcher XYZ"
→ Claude utilise get_event_stats avec watcher_id
```

#### 5. Exporter les événements

```
"Exporte tous les événements en CSV"
→ Claude utilise export_events avec format: "csv"
```

#### 6. Calculer le hash d'un fichier

```
"Calcule le SHA256 de /path/to/file.txt"
→ Claude utilise get_file_hash avec file_path et algorithm
```

## 📊 Format des événements

Chaque événement est enregistré au format JSON avec la structure suivante :

```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "watcher_id": "abc123...",
  "timestamp": "2025-11-22T21:30:45.123Z",
  "event_type": "modified",
  "file_path": "/home/user/Documents/projets/app.js",
  "relative_path": "app.js",
  "old_path": null,
  "file_size": 2048,
  "old_size": 1024,
  "hash_before": "sha256:abc123...",
  "hash_after": "sha256:def456...",
  "mime_type": "application/javascript"
}
```

### Types d'événements

- `created` : Nouveau fichier créé
- `modified` : Fichier modifié (contenu changé)
- `deleted` : Fichier supprimé
- `renamed` : Fichier renommé (détecté via heuristique)

## 🗂️ Structure du projet

```
skynet-filewatcher-mcp/
├── src/
│   ├── index.ts              # Serveur MCP principal
│   ├── watcher.ts            # Gestionnaire de watchers (chokidar)
│   ├── events-store.ts       # Stockage événements (JSONL)
│   ├── hash-utils.ts         # Utilitaires de hash
│   └── tools/
│       ├── watcher-tools.ts  # Tools MCP pour watchers
│       └── events-tools.ts   # Tools MCP pour événements
├── logs/
│   └── events.jsonl          # Logs des événements
├── config/
│   └── watchers.json         # Config persistante (futur)
├── dist/                     # Code compilé
├── package.json
├── tsconfig.json
├── install.sh                # Script d'installation
├── README.md
└── GUIDE_FRANCAIS.md         # Guide détaillé en français
```

## 🔍 Diagnostic et dépannage

### Le serveur ne démarre pas

```bash
# Vérifier les dépendances
npm install

# Recompiler
npm run build

# Vérifier la compilation
ls -la dist/index.js
```

### Les événements ne sont pas détectés

- Vérifier les permissions sur le dossier surveillé
- Vérifier les `ignorePatterns` (certains fichiers peuvent être exclus)
- Vérifier que le watcher est bien actif : `list_watchers`

### Performances lentes avec beaucoup de fichiers

- Réduire la profondeur de récursion
- Ajouter plus de patterns d'exclusion
- Désactiver le calcul de hash : `calculateHash: false`

### Les logs sont trop volumineux

```bash
# Nettoyer les événements avant une date
# Via Claude : "Supprime les événements avant le 1er novembre"

# Ou manuellement
rm logs/events.jsonl
```

## 🔐 Sécurité

### Bonnes pratiques

1. **Ne surveiller que les dossiers nécessaires** : Éviter la racine système
2. **Utiliser ignorePatterns** : Exclure les dossiers sensibles (.ssh, .gnupg)
3. **Limiter les permissions** : Le serveur n'a pas besoin de sudo
4. **Nettoyer régulièrement** : Les logs peuvent devenir volumineux

### Patterns d'exclusion recommandés

```javascript
[
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.cache/**',
  '**/.env*',
  '**/secrets/**',
  '**/*.log'
]
```

## 📈 Cas d'usage

### 1. Synchronisation avec Google Drive

Détecter les fichiers modifiés localement et déclencher un upload :

```
"Démarre la surveillance de ~/Skynet_Drive_Core"
→ Chaque modification → trigger n8n workflow → upload Drive
```

### 2. Moteur de réflexion

Logger tous les changements pour analyse par un agent IA :

```
→ FileWatcher détecte changement
→ Event loggé en JSON
→ Agent lit events.jsonl
→ Analyse et réaction
```

### 3. Backup automatique

Déclencher des backups incrémentaux :

```
→ Modification détectée
→ get_events filtre par modified
→ Backup uniquement les fichiers changés
```

### 4. Monitoring de développement

Surveiller un projet et logger l'activité :

```
→ Watcher sur /home/dev/projets
→ Statistiques quotidiennes
→ Rapport d'activité de développement
```

## 🛠️ Développement

### Scripts disponibles

```bash
# Développement avec rechargement auto
npm run dev

# Compiler le TypeScript
npm run build

# Compiler en mode watch
npm run watch

# Démarrer le serveur compilé
npm start

# Tests (à implémenter)
npm test
```

### Ajouter un nouvel outil

1. Créer le schema Zod dans `src/tools/`
2. Créer le handler async
3. Ajouter l'outil dans `src/index.ts` dans le tableau `tools`
4. Compiler et tester

## 📄 Licence

MIT - Voir le fichier LICENSE pour plus de détails

## 👥 Auteur

**Skynet Depot**

Conçu spécifiquement pour Claude Code CLI afin de surveiller le système de fichiers et faciliter l'intégration avec des systèmes de réflexion et d'automatisation.

## 🙏 Remerciements

- [Anthropic](https://www.anthropic.com/) pour le Model Context Protocol
- [chokidar](https://github.com/paulmillr/chokidar) pour le file watching robuste
- La communauté open-source

---

**Version :** 1.0.0
**Dernière mise à jour :** 2025-11-22
