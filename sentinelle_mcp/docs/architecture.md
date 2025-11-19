# 🟣 Sentinelle MCP - Architecture Documentation

## Vue d'ensemble

**Sentinelle MCP** est le système immunitaire de Skynet - un agent de surveillance contextuelle qui observe en temps réel tous les dossiers IA et réagit intelligemment aux changements.

## Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                     SENTINELLE MCP SYSTEM                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
        │   WATCHER    │ │  MCP       │ │   WPF      │
        │   ENGINE     │ │  SERVER    │ │   GUI      │
        │  (Python)    │ │  (Node.js) │ │  (C#)      │
        └──────┬───────┘ └─────┬──────┘ └─────┬──────┘
               │               │               │
               └───────┬───────┴───────┬───────┘
                       │               │
                ┌──────▼───────┐ ┌────▼─────┐
                │   AI BRIDGE  │ │  REPORTS │
                │ Claude/Gemini│ │   JSON   │
                └──────────────┘ └──────────┘
```

## Flux de Données Principal

```
1. FILE CHANGE DETECTED (watchdog)
          ↓
2. EVENT CAPTURED (watcher_service.py)
          ↓
3. EVENT PROCESSED (event_processor.py)
          ↓
4. CLASSIFICATION & ANALYSIS
          ↓
    ┌─────┴──────┐
    │            │
5a. AI ANALYSIS  5b. REPORT GENERATION
    (ai_bridge)     (report_generator)
    │            │
    └─────┬──────┘
          ↓
6. LOGGING (log_manager.py)
          ↓
7. NOTIFICATION (MCP → Raphaël)
          ↓
8. GUI UPDATE (real-time display)
```

## Composants Détaillés

### 1. Watcher Engine (Python)

**Fichier:** `backend_python/watcher_service.py`

**Responsabilités:**
- Surveiller multiple chemins configurables
- Détecter événements: created, modified, deleted, moved
- Filtrer par type de fichier
- Envoyer événements au processor

**Technologies:**
- `watchdog` library
- Multi-threading pour watchers parallèles
- Pattern matching pour filtres

**Configuration:**
```yaml
watchers:
  - path: "C:/AI_Projects"
    recursive: true
    ignore_patterns: ["*.tmp", "node_modules"]
  - path: "C:/Skynet_depot"
    recursive: true
```

### 2. Event Processor

**Fichier:** `backend_python/event_processor.py`

**Pipeline de traitement:**
```
RAW EVENT → Classification → Enrichment → Routing
```

**Classifications:**
- Type de fichier (code, document, config, data)
- Priorité (low, medium, high, critical)
- Catégorie (prompt, config, output, model)

**Enrichment:**
- Métadonnées du fichier
- Hash pour détection de modifications réelles
- Contexte du projet

### 3. Report Generator

**Fichier:** `backend_python/report_generator.py`

**Format de sortie:**
```json
{
  "report_id": "uuid",
  "timestamp": "ISO-8601",
  "event": {
    "type": "created|modified|deleted",
    "path": "full_path",
    "file_type": "extension",
    "size": "bytes"
  },
  "analysis": {
    "classification": "...",
    "priority": "...",
    "context": "..."
  },
  "ia_summary": {
    "model": "claude|gemini",
    "analysis": "...",
    "recommendations": []
  },
  "actions_taken": [
    "logged",
    "notified",
    "ai_analyzed"
  ]
}
```

Génère aussi un `.md` pour lecture humaine.

### 4. AI Bridge

**Fichier:** `backend_python/ai_bridge.py`

**Interfaces:**
- Claude CLI (subprocess)
- Gemini CLI (subprocess)
- MCP tools (HTTP calls)

**Prompts utilisés:**
- `analyze_change.md` - Analyse contextuelle
- `generate_reaction.md` - Suggestions d'actions
- `summarize_event.md` - Résumé multi-niveaux

**Sécurité:**
- Pas de fichiers sensibles envoyés
- Anonymisation des chemins optionnelle
- Validation des sorties IA

### 5. Configuration Manager

**Fichier:** `backend_python/config_manager.py`

**Structure config.yaml:**
```yaml
sentinelle:
  version: "1.0.0"

watchers:
  enabled: true
  paths: []
  ignore_patterns: []

ai:
  enabled: true
  default_model: "claude_cli"
  auto_analyze: false
  prompt_templates: "ai_prompts/"

logging:
  level: "INFO"
  max_size_mb: 100
  rotation: true

mcp:
  enabled: true
  endpoint: "http://localhost:3000"
  notify_raphael: true

notifications:
  email: false
  webhook: false
  telegram: false
```

### 6. Log Manager

**Fichier:** `backend_python/log_manager.py`

**Format log centralisé:**
```json
{
  "timestamp": "...",
  "level": "INFO|WARNING|ERROR",
  "component": "watcher|processor|ai_bridge|...",
  "event_id": "uuid",
  "message": "...",
  "metadata": {}
}
```

**Features:**
- Rotation automatique
- Append-only pour intégrité
- Recherche par timestamp, component, level

### 7. MCP Server (Node.js)

**Fichier:** `mcp/server.js`

**Endpoints:**

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/notify/event` | POST | Envoie notification d'événement |
| `/ai/analyze` | POST | Demande analyse IA d'un événement |
| `/watcher/update` | PUT | Met à jour config watchers |
| `/alert/raphael` | POST | Alerte Raphaël directement |
| `/health/sentinelle` | GET | État du système |
| `/reports/list` | GET | Liste des rapports |
| `/reports/:id` | GET | Détail d'un rapport |

**Tools MCP:**
- `ia_bridge.js` - Interface avec IA externes
- `notifications.js` - Système de notifications multi-canal

### 8. WPF GUI (C#/.NET)

**Architecture MVVM:**

```
Views → ViewModels → Services → Backend API
```

**Pages:**

1. **DashboardPage**
   - État en temps réel des watchers
   - Événements récents (live feed)
   - Métriques (events/hour, AI calls, etc.)
   - Statut MCP/AI

2. **WatcherConfigPage**
   - Liste des chemins surveillés
   - Add/Remove watchers
   - Configuration filtres
   - Enable/Disable par watcher

3. **LogsPage**
   - Affichage log_skynet.json
   - Recherche et filtres
   - Export logs

4. **IASettingsPage**
   - Choix modèle (Claude/Gemini)
   - Custom prompts
   - Auto-reaction toggle
   - Test AI connection

**Services:**
- `BackendClient.cs` - Communication avec Python backend
- `SettingsService.cs` - Gestion settings application

## Flux de Workflow Complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DÉTECTION                                                │
│    Watchdog détecte: file.py créé                          │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CAPTURE                                                  │
│    watcher_service.py → event object                       │
│    {path, type, timestamp, metadata}                       │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. PROCESSING                                               │
│    event_processor.py                                       │
│    → Classification (code file, Python, medium priority)   │
│    → Enrichment (hash, size, project context)              │
└────────────────────┬────────────────────────────────────────┘
                     ↓
                ┌────┴────┐
                │         │
┌───────────────▼──┐  ┌───▼──────────────┐
│ 4a. AI ANALYSIS  │  │ 4b. REPORT GEN   │
│ ai_bridge.py     │  │ report_gen.py    │
│ → Claude CLI     │  │ → JSON + MD      │
│ → Analyse code   │  │ → Save to disk   │
└───────────────┬──┘  └───┬──────────────┘
                │         │
                └────┬────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. LOGGING                                                  │
│    log_manager.py → log_skynet.json                        │
│    Append event avec AI summary                            │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. NOTIFICATION                                             │
│    MCP Server → /notify/event                              │
│    → Webhook (optionnel)                                   │
│    → Alert Raphaël si critique                             │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. GUI UPDATE                                               │
│    WPF Dashboard → Real-time event feed                    │
│    → Notification toast                                    │
└─────────────────────────────────────────────────────────────┘
```

## Sécurité et Confidentialité

### Données Sensibles
- Aucun fichier complet n'est envoyé aux IA
- Seulement métadonnées + résumé
- Option d'anonymisation des chemins
- Filtres configurables pour exclusions

### Logs
- Rotation automatique
- Pas de stockage de contenu de fichiers
- Hashing pour détection de doublons

### Communications
- MCP local par défaut
- HTTPS optionnel pour remote
- Authentification pour endpoints sensibles

## Performance

### Optimisations
- Watchers asynchrones (threading)
- Debouncing pour événements multiples rapides
- Cache pour éviter analyse répétée
- Lazy loading des rapports dans GUI

### Scalabilité
- Support de milliers de fichiers
- Filtrage intelligent pour réduire bruit
- Prioritisation des événements critiques

## Extensions Futures

1. **Sentinelle Pro**
   - ML interne pour détection d'anomalies
   - Pattern learning sur activité normale

2. **Anomaly Detector**
   - Détection de comportements suspects
   - Alertes automatiques

3. **Auto-Corrector**
   - Corrections automatiques via IA
   - Safe rollback mechanism

4. **Multi-Device Sync**
   - Synchronisation entre machines
   - Dashboard centralisé cloud

## Technologies Stack

| Composant | Technologies |
|-----------|-------------|
| Watcher Backend | Python 3.11+, watchdog, PyYAML, requests |
| MCP Server | Node.js 18+, Express, Axios |
| GUI | C# .NET 6+, WPF, MVVM toolkit |
| AI Integration | Claude CLI, Gemini CLI, subprocess |
| Logging | JSON structured logs, rotation |
| Config | YAML |
| Reports | JSON + Markdown |

## Déploiement

### Prérequis
- Windows 10/11
- Python 3.11+
- Node.js 18+
- .NET 6+ SDK
- Claude CLI et/ou Gemini CLI configurés

### Installation
```bash
# Backend Python
cd sentinelle_mcp/app/backend_python
pip install -r requirements.txt

# MCP Server
cd ../mcp
npm install

# GUI WPF
cd ../gui_wpf
dotnet restore
dotnet build
```

### Lancement
```bash
# 1. Démarrer backend Python
python watcher_service.py

# 2. Démarrer MCP server
node server.js

# 3. Lancer GUI WPF
dotnet run
```

## Monitoring et Maintenance

### Health Checks
- `/health/sentinelle` endpoint
- Auto-restart sur crash
- Logs d'erreurs détaillés

### Métriques Clés
- Events per hour
- AI analysis latency
- Report generation time
- MCP response time
- Watcher uptime

---

**Version:** 1.0.0
**Date:** 2025-11-18
**Status:** Active Development
**Auteur:** Skynet Engineering Team
