# TaskFlow MCP - Architecture Globale

## 🎯 Vision

**TaskFlow MCP** est un **Task Operating System** unifié qui centralise, organise et priorise intelligemment les tâches provenant de multiples sources (Gmail, GitHub, Trello, Notion, Slack).

L'architecture repose sur **3 piliers** :
- **Backend .NET** : API centrale + logique métier + persistence
- **MCP Node.js** : Orchestrateur de sources externes (hub d'intégration)
- **Frontend WinUI 3** : Interface Windows native + Pomodoro intégré

Le tout **assisté par IA** (Claude/GPT) pour la priorisation et l'analyse contextuelle.

---

## 🧱 Architecture Technique

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                      TaskFlow Desktop (WinUI 3)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │  Dashboard   │  │ Task Detail  │  │  Settings           │   │
│  │  + Pomodoro  │  │  + Tags      │  │  + Sync Config      │   │
│  └──────────────┘  └──────────────┘  └─────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST API (HTTPS)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TaskFlow.Api (.NET)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │  Tasks API   │  │  Sync API    │  │  Prioritizer API    │   │
│  │  Endpoints   │  │  (MCP bridge)│  │  (AI integration)   │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────────────┘   │
│         │                 │                  │                  │
│  ┌──────▼─────────────────▼──────────────────▼──────────────┐   │
│  │           TaskFlow.Core (Business Logic)                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐ │   │
│  │  │  TaskItem   │  │  Pomodoro   │  │  ITaskPrioritizer│ │   │
│  │  │  Models     │  │  Session    │  │  Interface       │ │   │
│  │  └─────────────┘  └─────────────┘  └──────────────────┘ │   │
│  └────────────────────────┬──────────────────────────────────┘   │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │       TaskFlow.Data (EF Core + SQLite)                  │    │
│  │  ┌──────────────┐  ┌──────────────┐                     │    │
│  │  │  TaskContext │  │  Migrations  │                     │    │
│  │  └──────────────┘  └──────────────┘                     │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Server (Node.js)                         │
│  ┌──────────────┐                                               │
│  │  server.js   │  Express API                                  │
│  │  - /fetch    │                                               │
│  │  - /fetch-all│                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│  ┌──────▼─────────────────────────────────────────────────┐     │
│  │              tools/ (Integration Layer)               │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │     │
│  │  │gmail.js  │  │github.js │  │trello.js │            │     │
│  │  └──────────┘  └──────────┘  └──────────┘            │     │
│  │  ┌──────────┐  ┌──────────┐                          │     │
│  │  │notion.js │  │slack.js  │                          │     │
│  │  └──────────┘  └──────────┘                          │     │
│  └────────────────────────────────────────────────────────┘     │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    ┌────────┐      ┌────────┐      ┌────────┐
    │ Gmail  │      │ GitHub │      │ Trello │
    │  API   │      │  API   │      │  API   │
    └────────┘      └────────┘      └────────┘
         ▼               ▼               ▼
    ┌────────┐      ┌────────┐
    │ Notion │      │ Slack  │
    │  API   │      │  API   │
    └────────┘      └────────┘

         ┌─────────────────────────────┐
         │   AI Layer (Future)         │
         │  ┌──────────────────────┐   │
         │  │ Claude CLI / GPT API │   │
         │  │ Task Prioritization  │   │
         │  │ Context Analysis     │   │
         │  └──────────────────────┘   │
         └─────────────────────────────┘
```

---

## 📦 Composants Détaillés

### 1. Backend .NET

#### TaskFlow.Core
**Rôle** : Logique métier + modèles de domaine

**Modèles principaux** :
```csharp
TaskItem {
    Id, Title, Description,
    Source (Gmail/GitHub/etc.),
    ExternalId,
    Status (Todo/InProgress/Done),
    Priority (1-5),
    Tags[],
    DueDate,
    EstimatedDuration,
    CreatedAt, UpdatedAt
}

PomodoroSession {
    Id, TaskId,
    StartTime, EndTime,
    Duration, IsBreak
}

IntegrationSource {
    Id, Name, Type,
    IsEnabled, LastSyncAt,
    ConfigJson
}
```

**Interfaces** :
```csharp
ITaskRepository
ITaskPrioritizer
IPomodoroService
IMcpClient
```

#### TaskFlow.Data
**Rôle** : Persistence (EF Core + SQLite)

**Contexte** :
```csharp
TaskFlowContext : DbContext {
    DbSet<TaskItem> Tasks
    DbSet<PomodoroSession> PomodoroSessions
    DbSet<IntegrationSource> Sources
}
```

**Migrations** :
- Initial : création des tables
- Indexes sur Source, Status, Priority pour les queries

#### TaskFlow.Api
**Rôle** : API REST exposée au frontend

**Endpoints** :
- `GET /api/tasks` → liste filtrable (source, status, tags)
- `GET /api/tasks/{id}` → détail d'une tâche
- `POST /api/tasks` → création manuelle
- `PUT /api/tasks/{id}` → mise à jour
- `DELETE /api/tasks/{id}` → suppression
- `POST /api/sync` → déclenche sync MCP
- `POST /api/tasks/prioritize` → demande reproirisation IA
- `GET /api/pomodoro/state` → état du timer actuel
- `POST /api/pomodoro/start` → démarrer un pomodoro
- `POST /api/pomodoro/stop` → arrêter
- `GET /api/sources` → liste des sources configurées

**Stack** :
- ASP.NET Core 7+
- Minimal API ou Controllers classiques
- Dependency Injection
- Swagger/OpenAPI

---

### 2. MCP Server (Node.js)

#### Rôle
Hub d'orchestration des intégrations externes. Interroge les APIs tierces et normalise les données vers un format unifié.

#### Architecture
```javascript
server.js
├── Express app
├── Endpoints:
│   ├── POST /fetch (source: string)
│   └── POST /fetch-all
└── Routes vers tools/

tools/
├── gmail.js      → fetchGmailTasks()
├── github.js     → fetchGithubTasks()
├── trello.js     → fetchTrelloTasks()
├── notion.js     → fetchNotionTasks()
└── slack.js      → fetchSlackTasks()
```

#### Format de sortie normalisé
Chaque `fetchXxxTasks()` retourne :
```javascript
{
  tasks: [
    {
      title: string,
      description: string,
      source: "gmail" | "github" | "trello" | "notion" | "slack",
      externalId: string,
      status: "todo" | "inprogress" | "done",
      priorityGuess: 1-5,
      tags: string[],
      dueDate: ISO8601 | null,
      url: string | null
    }
  ]
}
```

#### Configuration
`config.mcp.json` :
```json
{
  "port": 3000,
  "sources": {
    "gmail": { "enabled": true, "credentials": "..." },
    "github": { "enabled": true, "token": "..." },
    "trello": { "enabled": true, "apiKey": "..." },
    "notion": { "enabled": true, "token": "..." },
    "slack": { "enabled": true, "token": "..." }
  }
}
```

**Phase 1** : Mock data (pas d'appels API réels)
**Phase 2** : Intégrations réelles avec OAuth/tokens

---

### 3. Frontend WinUI 3

#### Rôle
Interface utilisateur Windows native pour visualiser et gérer les tâches.

#### Architecture MVVM
```
Views/
├── DashboardPage.xaml       → Liste + Kanban + Pomodoro
├── TaskDetailPage.xaml      → Détail tâche + tags
└── SettingsPage.xaml        → Config sources + API URL

ViewModels/
├── DashboardViewModel.cs
├── TaskDetailViewModel.cs
└── SettingsViewModel.cs

Services/
├── TaskService.cs           → Consomme TaskFlow.Api
├── PomodoroService.cs       → Timer + state
└── AiService.cs             → Future intégration IA
```

#### Fonctionnalités principales

**DashboardPage** :
- Liste de tâches avec colonnes : Source, Titre, Tags, Priorité, Due Date
- Filtres : par source, par tag, par statut
- Bouton "Sync MCP" → appelle `/api/sync`
- Bouton "Reprioriser avec IA" → appelle `/api/tasks/prioritize`
- Section Pomodoro :
  - Sélectionner une tâche
  - Start/Stop timer (25min work, 5min break)
  - Notifications Windows

**TaskDetailPage** :
- Affichage complet d'une tâche
- Édition tags, statut, priorité
- Lien vers la source externe (ex: GitHub issue URL)
- Historique des pomodoros

**SettingsPage** :
- URL de l'API backend
- Configuration des sources (enable/disable)
- Thème (Light/Dark)

#### Stack
- WinUI 3 (.NET 7+)
- MVVM Community Toolkit
- HttpClient pour consommer l'API
- SQLite local cache (optionnel)

---

### 4. Couche IA

#### Rôle (futur)
Analyser et prioriser les tâches en fonction du contexte, deadline, tags, et historique utilisateur.

#### Interface
```csharp
public interface ITaskPrioritizer {
    Task<List<TaskItem>> ReprioritizeAsync(List<TaskItem> tasks);
}
```

#### Implémentations

**MockTaskPrioritizer** (Phase 1) :
- Trie par due date + tag "urgent"
- Simule un délai IA (500ms)

**ClaudeCliTaskPrioritizer** (Phase 2) :
- Sérialise les tâches en JSON
- Appelle Claude CLI avec prompt spécifique
- Parse la réponse et met à jour les priorités

**GptApiTaskPrioritizer** (Phase 2) :
- Similaire mais via API OpenAI

#### Prompt type (ai/TaskPrioritizer.md)
```markdown
Tu es un assistant IA spécialisé dans la gestion de tâches.
Reçois une liste de tâches au format JSON.
Analyse-les selon :
- Urgence (due date)
- Importance (tags: urgent, important, deep-work, quick-win)
- Complexité estimée
- Source (ex: GitHub issues techniques > emails)

Retourne la liste triée par priorité (1-5) avec tags intelligents ajoutés.
```

---

## 🔄 Flux de Données

### Flux 1 : Synchronisation MCP
1. **User** clique "Sync MCP" dans WinUI app
2. **TaskFlow.Desktop** → `POST /api/sync`
3. **TaskFlow.Api** → `POST http://localhost:3000/fetch-all` (MCP Server)
4. **MCP Server** :
   - Appelle `gmail.fetchGmailTasks()`
   - Appelle `github.fetchGithubTasks()`
   - ... (toutes les sources)
   - Agrège les résultats
5. **TaskFlow.Api** :
   - Reçoit le JSON normalisé
   - Enregistre dans SQLite via `TaskFlow.Data`
   - Déduplique par `(Source, ExternalId)`
6. **TaskFlow.Desktop** :
   - Recharge la liste
   - Affiche notification "X nouvelles tâches"

### Flux 2 : Reproirisation IA
1. **User** clique "Reprioriser avec IA"
2. **TaskFlow.Desktop** → `POST /api/tasks/prioritize`
3. **TaskFlow.Api** :
   - Récupère toutes les tâches actives (non Done)
   - Appelle `ITaskPrioritizer.ReprioritizeAsync(tasks)`
4. **MockTaskPrioritizer** (Phase 1) :
   - Trie par algorithme simple
   - Retourne la liste réordonnée
5. **TaskFlow.Api** :
   - Met à jour `Priority` et `Tags` en DB
   - Retourne le résultat
6. **TaskFlow.Desktop** :
   - Rafraîchit la liste avec nouvelles priorités

### Flux 3 : Pomodoro
1. **User** sélectionne une tâche + clique "Start Pomodoro"
2. **TaskFlow.Desktop** → `POST /api/pomodoro/start` (taskId)
3. **TaskFlow.Api** :
   - Crée `PomodoroSession` avec `StartTime = Now`
   - Change statut de la tâche en `InProgress`
4. **TaskFlow.Desktop** :
   - Lance timer local (25min)
   - Affiche notification à la fin
   - `POST /api/pomodoro/stop` → enregistre `EndTime`

---

## 🛠️ Technologies

| Composant | Technologies |
|-----------|-------------|
| **Backend .NET** | ASP.NET Core 7, EF Core 7, SQLite, Minimal API |
| **MCP Server** | Node.js 18+, Express, Axios (pour appels API) |
| **Frontend** | WinUI 3, .NET 7, MVVM Community Toolkit |
| **IA (futur)** | Claude CLI, OpenAI API, Anthropic API |
| **Persistence** | SQLite (local), EF Core Migrations |
| **Config** | appsettings.json (.NET), config.mcp.json (Node) |

---

## 📂 Structure Projet

```
/taskflow_mcp/
  ├── backend/
  │     ├── dotnet/
  │     │     ├── TaskFlow.sln
  │     │     ├── TaskFlow.Api/
  │     │     │     ├── Program.cs
  │     │     │     ├── Controllers/ ou Endpoints/
  │     │     │     ├── appsettings.json
  │     │     │     └── TaskFlow.Api.csproj
  │     │     ├── TaskFlow.Core/
  │     │     │     ├── Models/
  │     │     │     ├── Interfaces/
  │     │     │     ├── Services/
  │     │     │     └── TaskFlow.Core.csproj
  │     │     └── TaskFlow.Data/
  │     │           ├── TaskFlowContext.cs
  │     │           ├── Repositories/
  │     │           ├── Migrations/
  │     │           └── TaskFlow.Data.csproj
  │     │
  │     └── mcp/
  │           ├── server.js
  │           ├── tools/
  │           │     ├── gmail.js
  │           │     ├── github.js
  │           │     ├── trello.js
  │           │     ├── notion.js
  │           │     └── slack.js
  │           ├── config.mcp.json
  │           ├── package.json
  │           └── README.md
  │
  ├── frontend/
  │     └── TaskFlow.Desktop/
  │           ├── App.xaml
  │           ├── App.xaml.cs
  │           ├── MainWindow.xaml
  │           ├── MainWindow.xaml.cs
  │           ├── Views/
  │           │     ├── DashboardPage.xaml
  │           │     ├── TaskDetailPage.xaml
  │           │     └── SettingsPage.xaml
  │           ├── ViewModels/
  │           │     ├── DashboardViewModel.cs
  │           │     ├── TaskDetailViewModel.cs
  │           │     └── SettingsViewModel.cs
  │           ├── Services/
  │           │     ├── TaskService.cs
  │           │     ├── PomodoroService.cs
  │           │     └── AiService.cs
  │           ├── Models/
  │           ├── Assets/
  │           └── TaskFlow.Desktop.csproj
  │
  ├── ai/
  │     ├── TaskPrioritizer.md            (prompt template)
  │     └── claude_cli_integration.md     (integration doc)
  │
  ├── docs/
  │     ├── architecture.md               (this file)
  │     ├── api-reference.md              (API endpoints doc)
  │     └── mcp-protocol.md               (MCP integration spec)
  │
  ├── README.md
  └── .gitignore
```

---

## 🚀 Phase de Développement

### Phase 1 : MVP (Mock Data)
- ✅ Architecture définie
- ✅ Backend .NET avec API minimale
- ✅ MCP Server avec données mockées
- ✅ Frontend WinUI 3 basique (liste + pomodoro)
- ✅ Mock IA prioritizer

### Phase 2 : Intégrations Réelles
- 🔄 OAuth flows pour Gmail, GitHub, etc.
- 🔄 Appels API réels dans MCP tools
- 🔄 Gestion des credentials sécurisée

### Phase 3 : IA Avancée
- 🔄 Intégration Claude CLI
- 🔄 Intégration GPT API
- 🔄 Auto-tagging intelligent
- 🔄 Suggestions de planning

### Phase 4 : Features Avancées
- 🔄 Calendrier intégré
- 🔄 Auto-scheduling
- 🔄 Focus Mode (bloque distractions)
- 🔄 Stats + analytics
- 🔄 Export (CSV, Markdown, etc.)

---

## 🔐 Sécurité

- **Credentials** : Stockés dans config chiffrés (Phase 2)
- **API** : HTTPS only, CORS configuré
- **Tokens** : Refresh automatique
- **Local DB** : SQLite avec encryption (optionnel)

---

## 📊 Performance

- **Sync** : Maximum 30s pour toutes les sources
- **API** : <100ms pour queries simples
- **UI** : Virtualisation pour listes >1000 items
- **Cache** : Redis (Phase 3) pour réduire appels API

---

## 🧪 Tests

- **Backend** : xUnit + Moq
- **MCP** : Jest
- **Frontend** : WinAppDriver (UI tests)

---

Cette architecture pose les **fondations solides** d'un vrai Task OS, évolutif et maintenable.
