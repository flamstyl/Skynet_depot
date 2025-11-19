# TaskFlow MCP - Skynet Task Orchestrator

**A unified task management system that aggregates, prioritizes, and orchestrates tasks from multiple sources using AI.**

---

## Overview

TaskFlow MCP is a **full-stack task operating system** that:

- **Aggregates** tasks from Gmail, GitHub, Trello, Notion, and Slack
- **Centralizes** everything into a unified API and database
- **Prioritizes** intelligently using AI (Claude/GPT)
- **Visualizes** in a beautiful Windows desktop app (WinUI 3)
- **Orchestrates** via an MCP (Multi-Channel Protocol) server

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              TaskFlow Desktop (WinUI 3)                 │
│          Dashboard • Pomodoro • Settings                │
└────────────────────┬────────────────────────────────────┘
                     │ REST API
                     ▼
┌─────────────────────────────────────────────────────────┐
│           TaskFlow.Api (.NET 7)                         │
│     Tasks • Sync • Prioritization • Pomodoro            │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP
                     ▼
┌─────────────────────────────────────────────────────────┐
│           MCP Server (Node.js)                          │
│     Gmail • GitHub • Trello • Notion • Slack            │
└─────────────────────────────────────────────────────────┘
```

**3-Tier Architecture:**
1. **Backend .NET**: API + Business Logic + SQLite Database
2. **MCP Node.js**: Multi-source task aggregation hub
3. **Frontend WinUI 3**: Native Windows desktop interface

See [Architecture Documentation](docs/architecture.md) for details.

---

## Features

### Phase 1 (MVP - Current)

- ✅ Multi-source task aggregation (Gmail, GitHub, Trello)
- ✅ Unified REST API with .NET
- ✅ SQLite persistence
- ✅ MCP server with mock data
- ✅ WinUI 3 desktop app
- ✅ Basic Pomodoro timer
- ✅ Mock AI prioritization
- ✅ Filtering by source, status, tags

### Phase 2 (Planned)

- 🔄 Real API integrations (OAuth flows)
- 🔄 Claude CLI / GPT API integration
- 🔄 Smart auto-tagging
- 🔄 Desktop notifications
- 🔄 Advanced Pomodoro stats
- 🔄 Calendar integration
- 🔄 Export (CSV, Markdown, JSON)

### Phase 3 (Future)

- 🔮 Auto-scheduling
- 🔮 Focus Mode (distraction blocking)
- 🔮 Analytics & insights
- 🔮 Team collaboration
- 🔮 Mobile app (optional)

---

## Getting Started

### Prerequisites

- **.NET 7 SDK** (for backend API)
- **Node.js 18+** (for MCP server)
- **Visual Studio 2022** or **Rider** (for WinUI 3 app)
- **Windows 10/11** (for WinUI 3)

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/your-org/taskflow-mcp.git
cd taskflow-mcp
```

#### 2. Start the MCP Server (Node.js)

```bash
cd backend/mcp
npm install
npm start
```

Server runs on `http://localhost:3000`

**Test it:**
```bash
curl -X POST http://localhost:3000/fetch-all
```

#### 3. Start the .NET API

```bash
cd backend/dotnet
dotnet restore
dotnet run --project TaskFlow.Api
```

API runs on `http://localhost:5000`

**Test it:**
```bash
curl http://localhost:5000/api/tasks
```

**Swagger UI:** `http://localhost:5000/swagger`

#### 4. Launch the WinUI 3 App

Open `frontend/TaskFlow.Desktop/TaskFlow.Desktop.csproj` in Visual Studio 2022.

Build and run (F5).

**Note:** Make sure both the MCP server and .NET API are running first.

---

## Project Structure

```
taskflow_mcp/
├── backend/
│   ├── dotnet/
│   │   ├── TaskFlow.Core/        # Business logic, models, interfaces
│   │   ├── TaskFlow.Data/        # EF Core, SQLite, repositories
│   │   ├── TaskFlow.Api/         # REST API endpoints
│   │   └── TaskFlow.sln
│   │
│   └── mcp/
│       ├── server.js             # Express server
│       ├── tools/                # Integration modules (gmail, github, etc.)
│       └── package.json
│
├── frontend/
│   └── TaskFlow.Desktop/         # WinUI 3 app
│       ├── Views/                # XAML pages
│       ├── ViewModels/           # MVVM view models
│       ├── Services/             # API clients
│       └── Models/               # Data models
│
├── ai/
│   ├── TaskPrioritizer.md        # AI prompt template
│   └── claude_cli_integration.md # Integration guide
│
├── docs/
│   └── architecture.md           # Full architecture documentation
│
└── README.md                     # This file
```

---

## Usage

### Syncing Tasks

1. Open the TaskFlow Desktop app
2. Click **"Sync MCP"** in the top toolbar
3. The app fetches tasks from all enabled sources via MCP
4. Tasks appear in the dashboard

### Prioritizing Tasks

1. Click **"Reprioriser"** in the toolbar
2. The AI analyzes all active tasks
3. Tasks are reordered by priority (1 = highest)
4. Smart tags are added (urgent, quick-win, deep-work)

### Using Pomodoro

1. Select a task from the list
2. Click **"Start"** in the Pomodoro section
3. Work for 25 minutes
4. Get notified when time is up
5. Click **"Stop"** to log the session

### Filtering Tasks

Use the filter dropdowns:
- **Source**: Show only Gmail, GitHub, Trello, etc.
- **Status**: Todo, InProgress, Done
- **Search**: Free-text search in title/description

---

## API Endpoints

### Tasks

- `GET /api/tasks` - List all tasks (with optional filters)
- `GET /api/tasks/{id}` - Get task by ID
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/{id}` - Update a task
- `DELETE /api/tasks/{id}` - Delete a task

### Sync

- `POST /api/sync` - Trigger MCP sync (fetch from all sources)

### Prioritization

- `POST /api/tasks/prioritize` - Reprioritize all active tasks with AI

### Pomodoro

- `GET /api/pomodoro/state` - Get current Pomodoro state
- `POST /api/pomodoro/start` - Start a Pomodoro session
- `POST /api/pomodoro/stop` - Stop current session

### Sources

- `GET /api/sources` - List configured integration sources

Full API documentation: `http://localhost:5000/swagger`

---

## MCP Server Endpoints

- `GET /health` - Health check
- `POST /fetch` - Fetch tasks from a specific source
  ```json
  { "source": "gmail" }
  ```
- `POST /fetch-all` - Fetch tasks from all enabled sources

See [MCP README](backend/mcp/README.md) for details.

---

## Configuration

### MCP Server

Edit `backend/mcp/config.mcp.json`:

```json
{
  "sources": {
    "gmail": { "enabled": true },
    "github": { "enabled": true },
    "trello": { "enabled": true },
    "notion": { "enabled": false },
    "slack": { "enabled": false }
  }
}
```

### .NET API

Edit `backend/dotnet/TaskFlow.Api/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=taskflow.db"
  },
  "McpServer": {
    "Url": "http://localhost:3000"
  }
}
```

### WinUI 3 App

Settings page in the app:
- API URL
- Source toggles
- Pomodoro duration
- Theme (Light/Dark)

---

## Development

### Adding a New Source

1. Create `backend/mcp/tools/newsource.js`
2. Implement `fetchNewsourceTasks()` returning normalized task objects
3. Add to `server.js` imports and `/fetch` endpoint
4. Update `config.mcp.json`

### Adding a New Endpoint

1. Add endpoint in `backend/dotnet/TaskFlow.Api/Program.cs`
2. Implement logic in `TaskFlow.Core/Services/`
3. Test with Swagger or curl
4. Update frontend `TaskService.cs` to call it

### Testing

```bash
# Backend tests (TODO: implement)
cd backend/dotnet
dotnet test

# Frontend tests (TODO: implement)
# Use WinAppDriver for UI tests
```

---

## Roadmap

### Short Term (v1.1)

- [ ] Real Gmail API integration with OAuth
- [ ] Real GitHub API integration with PAT
- [ ] Claude CLI integration for AI prioritization
- [ ] Desktop notifications (Windows Toast)

### Medium Term (v2.0)

- [ ] Notion database integration
- [ ] Slack action items parsing
- [ ] Calendar view + auto-scheduling
- [ ] Task dependencies & subtasks
- [ ] Export to CSV/Markdown

### Long Term (v3.0)

- [ ] Team collaboration features
- [ ] Multi-user support
- [ ] Mobile companion app
- [ ] Advanced analytics dashboard
- [ ] Custom AI training on user patterns

---

## Technologies

| Layer | Tech Stack |
|-------|-----------|
| Backend API | ASP.NET Core 7, EF Core 7, SQLite |
| MCP Server | Node.js 18, Express, Axios |
| Desktop App | WinUI 3, .NET 7, MVVM Toolkit |
| AI | Claude CLI, OpenAI API (future) |
| Database | SQLite (local), EF Core Migrations |

---

## Contributing

**Phase 1: Internal Development Only**

This project is currently in MVP phase. Contributions will be opened in Phase 2.

---

## License

Proprietary - Skynet Project

---

## Troubleshooting

### "Cannot connect to API"

- Ensure .NET API is running on `http://localhost:5000`
- Check firewall settings
- Verify URL in Settings page

### "MCP sync failed"

- Ensure MCP server is running on `http://localhost:3000`
- Check MCP server logs for errors
- Verify `McpServer:Url` in `appsettings.json`

### "Tasks not appearing"

- Click "Sync MCP" to fetch from sources
- Check filters (Source/Status dropdowns)
- Verify MCP tools are returning data (check server logs)

### WinUI 3 app won't build

- Ensure Windows SDK 10.0.19041.0+ is installed
- Target framework: `net7.0-windows10.0.19041.0`
- Run in Visual Studio 2022 (not VS Code)

---

## Contact

**Project Lead:** Skynet Team
**Repo:** `flamstyl/Skynet_depot`
**Branch:** `claude/taskflow-mcp-architecture-*`

---

**Built with Claude Code 4.5**

*TaskFlow MCP - Transforming chaos into orchestrated productivity.*
