# 🔍 Token Monitor MCP

**Real-time Token Consumption Tracking & Optimization Analysis**

Monitor, log, and analyze Claude API token usage to identify waste and optimize consumption.

---

## 🎯 Features

### Core Monitoring
- ✅ Real-time token counting per request
- ✅ Automatic logging with timestamps
- ✅ Detailed breakdown (input/output tokens)
- ✅ Cost calculation per request
- ✅ Session tracking
- ✅ Tool usage analytics

### Analysis & Reporting
- 📊 Daily/Weekly/Monthly consumption reports
- 🔍 Waste detection (redundant queries, large outputs)
- 💡 Optimization suggestions
- 📈 Trend analysis
- 🎯 Cost projections
- 🚨 Budget alerts

### MCP Integration
- 🔌 Standard MCP protocol
- 🛠️ 8 MCP tools exposed
- 📡 Real-time stats via HTTP
- 💾 SQLite database storage

---

## 📦 Installation

```bash
cd C:\Users\rapha\IA\Skynet_depot\token_monitor_mcp
npm install
```

## 🚀 Quick Start

```bash
# Start MCP server
npm start

# With custom port
npm start -- --port 3003
```

## 🛠️ MCP Tools

### 1. `log_token_usage`
Log a token consumption event
```json
{
  "input_tokens": 1500,
  "output_tokens": 800,
  "model": "claude-sonnet-4.5",
  "tool_name": "semantic_search",
  "context": "Searching codebase for user query"
}
```

### 2. `get_current_session_stats`
Get stats for current session
```json
{
  "total_tokens": 125000,
  "total_cost": 2.50,
  "request_count": 45,
  "avg_tokens_per_request": 2777
}
```

### 3. `get_waste_analysis`
Identify wasteful patterns
```json
{
  "large_outputs": [...],
  "redundant_queries": [...],
  "expensive_tools": [...],
  "recommendations": [...]
}
```

### 4. `get_daily_report`
Daily consumption summary
```json
{
  "date": "2025-11-19",
  "total_tokens": 250000,
  "total_cost": 5.00,
  "breakdown_by_tool": {...}
}
```

### 5. `get_optimization_tips`
AI-powered suggestions
```json
{
  "critical": ["Stop using read_file in loops"],
  "warnings": ["Large semantic_search results"],
  "tips": ["Batch independent operations"]
}
```

### 6. `set_budget_alert`
Configure budget warnings
```json
{
  "daily_limit": 1000000,
  "alert_threshold": 80
}
```

### 7. `export_analysis`
Export detailed report
```json
{
  "format": "json|csv|html",
  "period": "last_7_days"
}
```

### 8. `reset_session`
Start fresh session tracking

---

## 📊 Dashboard

Web dashboard available at: `http://localhost:3003/dashboard`

**Features:**
- Real-time token counter
- Session timeline
- Cost projections
- Waste heatmap
- Top consumers chart

---

## 🗄️ Database Schema

```sql
CREATE TABLE token_logs (
    id INTEGER PRIMARY KEY,
    timestamp TEXT,
    session_id TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    model TEXT,
    tool_name TEXT,
    context TEXT,
    cost_usd REAL,
    waste_detected BOOLEAN,
    waste_reason TEXT
);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    start_time TEXT,
    end_time TEXT,
    total_tokens INTEGER,
    total_cost REAL,
    request_count INTEGER
);
```

---

## 💰 Cost Tracking

**Current Claude Pricing (Nov 2025):**
- Input: $3 / 1M tokens
- Output: $15 / 1M tokens

**Auto-calculated per request:**
```javascript
cost = (input_tokens * 0.000003) + (output_tokens * 0.000015)
```

---

## 🚨 Waste Detection Rules

### Critical Waste
- ❌ Single request > 50K tokens
- ❌ Output > 10K tokens (truncated anyway)
- ❌ Same query repeated within 5 min
- ❌ read_file called 5+ times in sequence

### Warnings
- ⚠️ semantic_search returning full files
- ⚠️ grep_search with overly broad patterns
- ⚠️ Parallel calls without batching
- ⚠️ Large context in loops

### Optimization Suggestions
- 💡 Use file_search before read_file
- 💡 Batch independent operations
- 💡 Set maxResults on searches
- 💡 Use grep_search for file overviews
- 💡 Avoid read_file in loops

---

## 📁 Files Structure

```
token_monitor_mcp/
├── server.js              # Main MCP server
├── monitor.js             # Token tracking logic
├── analyzer.js            # Waste detection & analysis
├── database.js            # SQLite interface
├── dashboard/
│   ├── index.html        # Web dashboard
│   └── app.js            # Dashboard logic
├── logs/
│   ├── tokens_2025-11-19.json
│   └── sessions.json
├── analysis/
│   ├── waste_report.json
│   └── optimization_tips.json
├── package.json
├── config.json
└── README.md
```

---

## 🔧 Configuration

`config.json`:
```json
{
  "port": 3003,
  "database": "./logs/token_monitor.db",
  "pricing": {
    "claude-sonnet-4.5": {
      "input": 0.000003,
      "output": 0.000015
    }
  },
  "budgets": {
    "daily_limit": 1000000,
    "alert_threshold": 80
  },
  "waste_detection": {
    "large_request_threshold": 50000,
    "large_output_threshold": 10000,
    "duplicate_window_minutes": 5
  }
}
```

---

## 📈 Usage Examples

### Manual Logging (for testing)
```bash
curl -X POST http://localhost:3003/api/log \
  -H "Content-Type: application/json" \
  -d '{
    "input_tokens": 2500,
    "output_tokens": 1200,
    "model": "claude-sonnet-4.5",
    "tool_name": "semantic_search",
    "context": "Searching for authentication code"
  }'
```

### Get Current Stats
```bash
curl http://localhost:3003/api/stats
```

### Waste Analysis
```bash
curl http://localhost:3003/api/waste
```

---

## 🎯 Integration with VS Code Copilot

This MCP is designed to auto-capture token usage when used with Claude Code.

**Setup:**
1. Add to MCP config
2. Logs automatically on each request
3. View stats in dashboard
4. Get alerts when near budget

---

## 📊 Analysis Reports

### Daily Report Example
```json
{
  "date": "2025-11-19",
  "summary": {
    "total_tokens": 250000,
    "total_cost": 5.00,
    "request_count": 45,
    "waste_detected": 12000,
    "waste_cost": 0.24
  },
  "breakdown": {
    "semantic_search": 80000,
    "read_file": 60000,
    "grep_search": 40000,
    "other": 70000
  },
  "waste_events": [
    {
      "timestamp": "17:45:32",
      "tokens": 8000,
      "reason": "Large output truncated",
      "suggestion": "Use maxResults parameter"
    }
  ]
}
```

---

## 🚀 Roadmap

- [ ] Real-time WebSocket updates
- [ ] ML-based waste prediction
- [ ] Auto-optimization mode
- [ ] Budget enforcement
- [ ] Multi-model support
- [ ] Export to CSV/Excel
- [ ] Slack/Email alerts

---

## 📝 License

MIT

---

## 🤝 Contributing

This MCP is part of the Skynet ecosystem. Contributions welcome!
