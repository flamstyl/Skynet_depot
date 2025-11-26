# TaskFlow MCP Server

**Multi-source task aggregation server** powered by Node.js.

## Overview

The MCP (Multi-Channel Protocol) Server acts as the **central hub** for fetching tasks from multiple external sources:
- Gmail (emails)
- GitHub (issues/PRs)
- Trello (cards)
- Notion (database entries)
- Slack (action items)

It normalizes all data into a unified task format and exposes REST endpoints for the TaskFlow API to consume.

## Installation

```bash
npm install
```

## Running

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

Server will start on `http://localhost:3000`

## API Endpoints

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "TaskFlow MCP Server",
  "version": "1.0.0"
}
```

### `POST /fetch`
Fetch tasks from a specific source.

**Request body:**
```json
{
  "source": "gmail"
}
```

**Response:**
```json
{
  "tasks": [
    {
      "title": "Review proposal from client X",
      "description": "...",
      "source": "Gmail",
      "externalId": "msg_123",
      "status": "todo",
      "priorityGuess": 2,
      "tags": ["email", "client"],
      "dueDate": "2024-01-15T10:00:00.000Z",
      "url": "https://..."
    }
  ]
}
```

### `POST /fetch-all`
Fetch tasks from all enabled sources.

**Response:**
```json
{
  "tasks": [
    // Array of tasks from all sources
  ]
}
```

## Configuration

Edit `config.mcp.json` to:
- Enable/disable sources
- Configure API credentials (Phase 2)
- Set sync intervals

## Current Status

**Phase 1 (MVP):**
- ✅ Server framework with Express
- ✅ Mock data for all sources
- ✅ Unified task format
- ✅ REST endpoints

**Phase 2 (Real Integrations):**
- 🔄 OAuth flows for Gmail
- 🔄 GitHub Personal Access Token integration
- 🔄 Trello API key + token
- 🔄 Notion integration token
- 🔄 Slack bot token

## Development

### Adding a new source

1. Create `tools/newsource.js`
2. Implement `fetchNewsourceTasks()` function
3. Return array of task objects matching the schema
4. Add to `server.js` imports and switch statement

### Task Schema

```javascript
{
  title: string,           // Required
  description: string,     // Optional
  source: string,          // Required: "Gmail", "GitHub", etc.
  externalId: string,      // Optional: ID in source system
  status: string,          // Required: "todo" | "inprogress" | "done"
  priorityGuess: number,   // 1-5, default 3
  tags: string[],          // Array of tags
  dueDate: string | null,  // ISO8601 date or null
  url: string | null       // Link to source
}
```
