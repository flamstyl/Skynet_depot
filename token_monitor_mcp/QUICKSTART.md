# 🚀 Quick Start - Token Monitor MCP

## Installation

```bash
cd C:\Users\rapha\IA\Skynet_depot\token_monitor_mcp
npm install
```

## Démarrage

```bash
npm start
```

**Outputs:**
- ✅ MCP Server (stdio mode)
- 🌐 HTTP API: http://localhost:3003
- 📊 Dashboard: http://localhost:3003/dashboard

## Test Manuel

```bash
# Log un événement
curl -X POST http://localhost:3003/api/log -H "Content-Type: application/json" -d "{\"input_tokens\": 2500, \"output_tokens\": 1200, \"model\": \"claude-sonnet-4.5\", \"tool_name\": \"semantic_search\", \"context\": \"Test query\"}"

# Stats actuelles
curl http://localhost:3003/api/stats

# Analyse des déchets
curl http://localhost:3003/api/waste
```

## Intégration MCP

Ajouter à la config MCP de Claude Code:

```json
{
  "mcpServers": {
    "token-monitor": {
      "command": "node",
      "args": ["C:\\Users\\rapha\\IA\\Skynet_depot\\token_monitor_mcp\\server.js"]
    }
  }
}
```

## Utilisation

### Via MCP Tools

```javascript
// Log token usage
{
  "tool": "log_token_usage",
  "arguments": {
    "input_tokens": 1500,
    "output_tokens": 800,
    "model": "claude-sonnet-4.5",
    "tool_name": "read_file",
    "context": "Reading main.py"
  }
}

// Get session stats
{
  "tool": "get_current_session_stats"
}

// Analyze waste
{
  "tool": "get_waste_analysis",
  "arguments": {
    "period": "current_session"
  }
}
```

## Dashboard

Ouvre http://localhost:3003/dashboard pour voir:

- 📊 Token totaux en temps réel
- 💰 Coût cumulé
- ⚠️ Événements de gaspillage
- 💡 Recommandations d'optimisation
- 📈 Progression vs budget quotidien

## Logs

Les logs sont automatiquement sauvegardés dans:

- `logs/tokens_YYYY-MM-DD.json` - Logs quotidiens
- `logs/token_monitor.db` - Base SQLite
- `logs/alerts.json` - Alertes budget
- `analysis/` - Rapports exportés

## Règles de Détection de Gaspillage

**Critique** (bloquant):
- Request > 50K tokens
- Output > 10K tokens (probablement tronqué)
- read_file appelé 5+ fois en 1 minute

**Warning**:
- semantic_search avec output > 5K tokens
- Requêtes dupliquées dans 5 min
- Pattern inefficace détecté

## Configuration

Éditer `config.json` pour ajuster:

```json
{
  "budgets": {
    "daily_limit_tokens": 1000000,
    "daily_limit_usd": 20.0,
    "alert_threshold_percent": 80
  },
  "waste_detection": {
    "large_request_threshold": 50000,
    "large_output_threshold": 10000
  }
}
```

## Exemples de Rapports

### Daily Report
```bash
curl http://localhost:3003/api/report/2025-11-19
```

### Export Analysis
```javascript
{
  "tool": "export_analysis",
  "arguments": {
    "format": "html",
    "period": "today"
  }
}
```

Fichier généré: `analysis/analysis_today_[timestamp].html`

---

**Status:** ✅ Ready to use
**Documentation:** README.md
**Support:** Skynet ecosystem
