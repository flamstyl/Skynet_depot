# 🏗️ Token Monitor MCP - Architecture

## Overview

Token Monitor MCP est un serveur MCP (Model Context Protocol) conçu pour surveiller, analyser et optimiser la consommation de tokens des API Claude.

**Version:** 1.0.0  
**Protocole:** MCP Standard  
**Type:** Stdio + HTTP API  

---

## Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                     VS Code + Claude Code                    │
│  (Client qui appelle les tools et génère des tokens)        │
└───────────────────────┬─────────────────────────────────────┘
                        │ MCP Stdio Protocol
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Token Monitor MCP Server                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  MCP Server (stdio)                                  │   │
│  │  - 8 MCP Tools                                       │   │
│  │  - CallToolRequestSchema handler                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────┐  ┌────────────────┐  ┌────────────┐ │
│  │  TokenMonitor    │  │ TokenAnalyzer  │  │  Database  │ │
│  │  - logUsage()    │  │ - analyzeWaste │  │  (SQLite)  │ │
│  │  - getStats()    │  │ - getDailyReport│  │            │ │
│  │  - detectWaste() │  │ - getOptiTips  │  │            │ │
│  └──────────────────┘  └────────────────┘  └────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  HTTP API (Express)                                  │   │
│  │  - GET /api/stats                                    │   │
│  │  - GET /api/waste                                    │   │
│  │  - POST /api/log                                     │   │
│  │  - GET /dashboard                                    │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
            ┌───────────┴──────────┐
            ▼                      ▼
    ┌──────────────┐      ┌──────────────┐
    │  JSON Logs   │      │  Dashboard   │
    │  (auto-save) │      │  (Web UI)    │
    └──────────────┘      └──────────────┘
```

---

## Composants

### 1. **server.js** - Point d'entrée principal

**Responsabilités:**
- Initialise le serveur MCP (stdio)
- Démarre le serveur HTTP Express
- Enregistre les 8 MCP tools
- Route les requêtes vers TokenMonitor et TokenAnalyzer

**Ports:**
- MCP: stdio (standard input/output)
- HTTP: 3003 (configurable)

**Dépendances:**
- `@modelcontextprotocol/sdk`
- `express`
- `monitor.js`
- `analyzer.js`

---

### 2. **monitor.js** - Token Tracking Core

**Class:** `TokenMonitor`

**Méthodes principales:**

```javascript
logUsage(inputTokens, outputTokens, model, toolName, context)
// → Log un événement de consommation
// → Détecte automatiquement le gaspillage
// → Calcule le coût
// → Sauvegarde en DB + JSON
// → Déclenche alertes budget si nécessaire

getSessionStats()
// → Retourne stats de la session courante

getDailyStats(date)
// → Stats d'une journée spécifique

resetSession()
// → Termine session actuelle et en démarre une nouvelle
```

**Logique de détection de gaspillage:**

```javascript
if (totalTokens > 50000) {
  → CRITICAL: "Large request"
}
else if (outputTokens > 10000) {
  → CRITICAL: "Large output (likely truncated)"
}
else if (toolName === "read_file" && recentCount >= 5) {
  → WARNING: "read_file in loop"
}
else if (toolName === "semantic_search" && outputTokens > 5000) {
  → WARNING: "semantic_search without constraints"
}
```

**Calcul du coût:**

```javascript
cost = (inputTokens * 0.000003) + (outputTokens * 0.000015)
// Pricing Claude Sonnet 4.5 (Nov 2025)
```

**Auto-logging:**
- Chaque événement → `logs/tokens_YYYY-MM-DD.json`
- Base SQLite → `logs/token_monitor.db`
- Alertes budget → `logs/alerts.json`

---

### 3. **analyzer.js** - Waste Analysis & Optimization

**Class:** `TokenAnalyzer`

**Méthodes principales:**

```javascript
analyzeWaste(period)
// → Analyse gaspillage sur une période
// → Retourne: total waste, waste by type, top wasteful tools

getDailyReport(date)
// → Rapport quotidien détaillé
// → Breakdown par tool
// → Distribution horaire

getOptimizationTips()
// → Suggestions d'optimisation basées sur patterns détectés
// → Catégorisé: critical, warnings, suggestions

exportAnalysis(format, period)
// → Exporte rapport en JSON, CSV ou HTML
```

**Patterns de gaspillage détectés:**

1. **Loops inefficaces**
   - read_file appelé > 5 fois → "Use file_search first"
   
2. **Outputs tronqués**
   - output > 8K tokens → "Use limit parameters"
   
3. **Searches sans contraintes**
   - semantic_search sans maxResults → "Add constraints"
   
4. **Requêtes dupliquées**
   - Même query < 5 min → "Cache results"

**Métriques calculées:**
- Waste rate (%)
- Wasted cost ($)
- Potential savings
- Tool efficiency scores

---

### 4. **database.js** - SQLite Persistence

**Tables:**

```sql
token_logs:
- id (TEXT PRIMARY KEY)
- timestamp (TEXT)
- session_id (TEXT)
- input_tokens (INTEGER)
- output_tokens (INTEGER)
- total_tokens (INTEGER)
- model (TEXT)
- tool_name (TEXT)
- context (TEXT)
- cost_usd (REAL)
- waste_detected (BOOLEAN)
- waste_reason (TEXT)
- waste_severity (TEXT)

sessions:
- id (TEXT PRIMARY KEY)
- start_time (TEXT)
- end_time (TEXT)
- total_tokens (INTEGER)
- total_cost (REAL)
- request_count (INTEGER)
```

**Indexes:**
- `idx_timestamp` sur token_logs(timestamp)
- `idx_session` sur token_logs(session_id)
- `idx_tool` sur token_logs(tool_name)

**Rétention:**
- Configurable (default: 30 jours)
- Auto-purge via CRON ou manuel

---

### 5. **dashboard/index.html** - Web UI

**Fonctionnalités:**

📊 **Stats en temps réel** (refresh 2s):
- Total tokens
- Coût cumulé
- Nombre de requêtes
- Événements de gaspillage

📈 **Graphiques:**
- Budget progress bar
- Timeline des waste events
- Breakdown par tool

💡 **Optimizations:**
- Tips critiques
- Warnings
- Suggestions

**Technologie:**
- HTML/CSS/JS vanilla
- Fetch API pour polling
- Responsive design

---

## MCP Tools Exposés

### 1. `log_token_usage`
```json
{
  "input_tokens": number,
  "output_tokens": number,
  "model": string,
  "tool_name": string,
  "context": string
}
```
→ Log event + auto-detect waste + return stats

### 2. `get_current_session_stats`
→ Stats session actuelle (tokens, cost, requests, waste)

### 3. `get_waste_analysis`
```json
{
  "period": "current_session|today|last_7_days"
}
```
→ Analyse complète du gaspillage

### 4. `get_daily_report`
```json
{
  "date": "YYYY-MM-DD"
}
```
→ Rapport quotidien détaillé

### 5. `get_optimization_tips`
→ Suggestions personnalisées basées sur usage patterns

### 6. `set_budget_alert`
```json
{
  "daily_limit_tokens": number,
  "daily_limit_usd": number,
  "alert_threshold_percent": number
}
```
→ Configure alertes budget

### 7. `export_analysis`
```json
{
  "format": "json|csv|html",
  "period": "today|last_7_days|last_30_days|all"
}
```
→ Exporte rapport vers `analysis/`

### 8. `reset_session`
→ Reset session tracking

---

## Flux de Données

### Scenario 1: Log automatique (Claude Code → MCP)

```
1. Claude Code exécute tool "semantic_search"
2. VS Code Copilot détecte consommation tokens
3. Appel MCP: log_token_usage(1500 input, 800 output)
4. TokenMonitor:
   - Calcule cost: (1500*0.000003) + (800*0.000015) = $0.0165
   - Détecte waste: None
   - Insert DB
   - Export JSON log
   - Check budget: OK
5. Retourne: {logged: true, cost: 0.0165, session_total: 2300}
```

### Scenario 2: Détection de gaspillage

```
1. Claude Code execute read_file 6 fois en 1 minute
2. 6e appel → TokenMonitor.detectWaste()
3. Détection: recentReadFiles.length >= 5
4. Waste = {
     detected: true,
     reason: "read_file called 6 times in 1 minute",
     severity: "warning"
   }
5. Log avec waste flag
6. TokenAnalyzer génère tip: 
   "⚠️ Using read_file in loop. Consider file_search first."
7. Dashboard affiche waste event en orange
```

### Scenario 3: Budget alert

```
1. Session atteint 850K tokens (85% du daily limit)
2. TokenMonitor.checkBudgetAlerts()
3. 85% > 80% threshold
4. Génère alert:
   {
     type: "budget_alert",
     token_usage: "85.0%",
     message: "⚠️ Budget Alert: 85% of daily limit reached"
   }
5. Log dans alerts.json
6. Console.warn()
7. Dashboard affiche warning banner
```

---

## Configuration

**config.json:**

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
    "daily_limit_tokens": 1000000,
    "daily_limit_usd": 20.0,
    "alert_threshold_percent": 80
  },
  "waste_detection": {
    "large_request_threshold": 50000,
    "large_output_threshold": 10000,
    "duplicate_window_minutes": 5
  }
}
```

---

## Optimisations Futures

### Phase 2:
- [ ] ML-based waste prediction
- [ ] Real-time WebSocket dashboard
- [ ] Multi-user support
- [ ] Slack/Email notifications
- [ ] Budget enforcement (block if exceeded)

### Phase 3:
- [ ] Auto-optimization mode (suggest code changes)
- [ ] Integration with CI/CD pipelines
- [ ] Cost comparison vs competitors
- [ ] Team analytics dashboard
- [ ] Export to Grafana/Prometheus

---

## Performance

**Overhead:**
- Log operation: < 5ms
- Database insert: < 10ms
- Waste detection: < 2ms
- Dashboard refresh: 2s interval

**Scalability:**
- SQLite supports 100K+ logs easily
- JSON logs rotation every 30 days
- In-memory session cache for speed

---

## Sécurité

**Pas de données sensibles:**
- Pas de stockage de prompts complets
- Context field limité à 200 chars
- Pas de logs d'outputs réels

**Access control:**
- MCP via stdio (local only)
- HTTP API localhost uniquement
- Pas d'authentification (local dev tool)

---

## Tests

**Test suite:** `test.js`

```bash
npm test
```

**Coverage:**
- Log normal usage ✅
- Log wasteful usage ✅
- Session stats ✅
- Waste analysis ✅
- Optimization tips ✅
- read_file loop detection ✅

---

## Maintenance

**Logs cleanup:**
```bash
# Delete logs older than 30 days
find logs/ -name "tokens_*.json" -mtime +30 -delete
```

**Database vacuum:**
```bash
sqlite3 logs/token_monitor.db "VACUUM;"
```

**Reset all data:**
```bash
rm -rf logs/*.json logs/*.db
```

---

**Auteur:** Skynet Dev Team  
**License:** MIT  
**Support:** Skynet ecosystem  
**Version:** 1.0.0 (Nov 2025)
