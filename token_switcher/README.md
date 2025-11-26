# 🟣 Skynet Token Switcher

**Intelligent API Token Manager for Claude & Gemini**

A tactical anti-blackout weapon for managing multiple API providers with intelligent quota tracking, automatic switching, and real-time monitoring.

---

## 🎯 Purpose

The Skynet Token Switcher prevents API quota blackouts by:

- **Tracking** token usage across multiple providers (Claude, Gemini, etc.)
- **Switching** automatically to the provider with the most available quota
- **Monitoring** quota levels in real-time with visual dashboard
- **Alerting** when providers approach quota limits
- **Logging** all API usage for auditing and analysis
- **Providing** an internal API for agent integration

---

## 🏗️ Architecture

```
/token_switcher/
├── app/
│   ├── server.py           # Flask application
│   ├── database.py         # SQLite database manager
│   ├── quota_manager.py    # Quota calculation engine
│   ├── switcher_engine.py  # Intelligent provider selection
│   └── api_routes.py       # API endpoints
│
├── templates/
│   └── dashboard.html      # Web dashboard UI
│
├── static/
│   └── styles.css          # Skynet dark theme
│
├── data/
│   └── tokens.db           # SQLite database (auto-created)
│
├── README.md
└── run_switcher.py         # Application launcher
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install flask flask-cors
```

### 2. Launch the Switcher

```bash
cd token_switcher
python run_switcher.py
```

### 3. Access Dashboard

Open your browser to:
```
http://127.0.0.1:5050
```

### 4. Add Your First API Key

Click **"+ Add Key"** and enter:
- **Provider**: `claude` or `gemini`
- **API Key**: Your API key (e.g., `sk-ant-xxx...`)
- **Total Quota**: Total tokens available (e.g., `500000`)

---

## 📊 Dashboard Features

### System Status
- **Total Providers**: Number of configured API providers
- **Available**: Number of providers with remaining quota
- **Overall Usage**: Aggregate usage percentage
- **Forced Provider**: Currently forced provider (if any)

### Provider Cards
Each provider shows:
- **State Badge**: `OK` / `WARNING` / `CRITICAL` / `DEPLETED`
- **Usage Stats**: Used, Total, Remaining, Percentage
- **Progress Bar**: Visual quota consumption
- **Actions**: Force provider, Reset quota

### Recommendation Engine
- Analyzes all providers
- Recommends optimal provider
- Shows system health status

### Usage History
- Real-time log of API calls
- Token consumption per call
- Success/failure tracking
- Timestamps for all events

---

## 🔌 API Endpoints

### Get System Status
```http
GET /api/status
```

**Response:**
```json
{
  "success": true,
  "providers": [
    {
      "provider": "claude",
      "quota_total": 500000,
      "quota_used": 125000,
      "remaining": 375000,
      "used_pct": 25.0,
      "state": "ok"
    }
  ],
  "health": {
    "status": "healthy",
    "message": "All providers operational"
  }
}
```

### Choose Best Provider
```http
POST /api/choose
Content-Type: application/json

{
  "tokens_estimate": 1000
}
```

**Response:**
```json
{
  "success": true,
  "provider": "claude",
  "api_key": "sk-ant-xxx...",
  "remaining_after": 374000,
  "reason": "optimal_selection"
}
```

### Register API Usage
```http
POST /api/use
Content-Type: application/json

{
  "provider": "claude",
  "tokens_used": 1500,
  "success": true,
  "reason": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usage registered for claude",
  "tokens_used": 1500
}
```

### Add/Update API Key
```http
POST /api/add_key
Content-Type: application/json

{
  "provider": "claude",
  "api_key": "sk-ant-xxx...",
  "quota_total": 500000
}
```

### Get Usage History
```http
GET /api/history?limit=50
```

### Force Specific Provider
```http
POST /api/force_provider
Content-Type: application/json

{
  "provider": "claude"
}
```

### Clear Forced Provider
```http
POST /api/clear_forced
```

### Reset Provider Quota
```http
POST /api/reset_quota
Content-Type: application/json

{
  "provider": "claude"
}
```

### Health Check
```http
GET /api/health
```

---

## 🧠 Intelligent Switching Logic

The switcher engine uses the following priority system:

### 1. **Availability Check**
- Provider must not be depleted
- Provider must have remaining quota

### 2. **Priority Score Calculation**
- **Base Score**: Remaining quota percentage
- **Provider Bonus**: +10 for Claude (preferred)
- **State Penalty**:
  - OK: 0
  - Warning: -5
  - Critical: -15
  - Depleted: -100

### 3. **Fallback Logic**
- If forced provider is set and available, use it
- Otherwise, select provider with highest priority score
- If all depleted, return error

### 4. **State Thresholds**
- **OK**: < 80% used
- **Warning**: 80-90% used
- **Critical**: 90-100% used
- **Depleted**: ≥ 100% used

---

## 💡 Integration Examples

### Python Agent Integration

```python
import requests

# Get recommended provider
response = requests.post('http://127.0.0.1:5050/api/choose', json={
    'tokens_estimate': 2000
})
result = response.json()

if result['success']:
    provider = result['provider']
    api_key = result['api_key']

    # Use the recommended provider
    # ... make your API call ...

    # Register the usage
    requests.post('http://127.0.0.1:5050/api/use', json={
        'provider': provider,
        'tokens_used': 2000,
        'success': True
    })
else:
    print(f"No providers available: {result['message']}")
```

### JavaScript Integration

```javascript
// Choose provider
const chooseProvider = async (tokensEstimate) => {
  const response = await fetch('http://127.0.0.1:5050/api/choose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokens_estimate: tokensEstimate })
  });

  return response.json();
};

// Register usage
const registerUsage = async (provider, tokensUsed, success) => {
  await fetch('http://127.0.0.1:5050/api/use', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, tokens_used: tokensUsed, success })
  });
};
```

---

## 🗄️ Database Schema

### `api_keys` Table

| Column       | Type    | Description                    |
|--------------|---------|--------------------------------|
| id           | INTEGER | Primary key                    |
| provider     | TEXT    | Provider name (unique)         |
| api_key      | TEXT    | API key                        |
| quota_total  | INTEGER | Total quota in tokens          |
| quota_used   | INTEGER | Used quota in tokens           |
| last_update  | TEXT    | ISO timestamp of last update   |

### `usage_log` Table

| Column       | Type    | Description                    |
|--------------|---------|--------------------------------|
| id           | INTEGER | Primary key                    |
| provider     | TEXT    | Provider name                  |
| timestamp    | TEXT    | ISO timestamp                  |
| tokens_used  | INTEGER | Tokens consumed                |
| success      | INTEGER | 1 if successful, 0 if failed   |
| reason       | TEXT    | Error message or reason        |

---

## 🎨 UI Features

### Dark Mode Theme
- **Background**: `#121212` (Skynet black)
- **Accents**: Purple `#9333ea` & Blue `#6366f1`
- **States**:
  - Green (OK)
  - Orange (Warning)
  - Red (Critical)
  - Gray (Depleted)

### Auto-Refresh
- Dashboard updates every **5 seconds**
- Real-time quota monitoring
- Live usage logs

### Responsive Design
- Desktop optimized
- Mobile friendly
- Touch-friendly controls

---

## 🔒 Security Notes

⚠️ **IMPORTANT**: This application is designed for **local use only**.

- Runs on `127.0.0.1` (localhost)
- API keys stored in local SQLite database
- No external network exposure
- CORS enabled only for localhost

**For production use:**
- Add authentication
- Encrypt API keys
- Use HTTPS
- Implement rate limiting
- Add access controls

---

## 🛠️ Maintenance

### Reset All Quotas
```python
from app.database import Database
db = Database()

for key in db.get_all_keys():
    db.reset_quota(key['provider'])
```

### Clear Usage History
```bash
rm data/tokens.db
# Database will be recreated on next launch
```

### Backup Database
```bash
cp data/tokens.db data/tokens.db.backup
```

---

## 📈 Future Enhancements

- [ ] Multi-region support
- [ ] Cost tracking per provider
- [ ] Email/Slack alerts on quota thresholds
- [ ] Export usage reports (CSV, JSON)
- [ ] Provider performance metrics
- [ ] API call success rate tracking
- [ ] Custom quota reset schedules
- [ ] Provider health monitoring
- [ ] Load balancing strategies

---

## 🧪 Testing the Switcher

### Simulate API Call

```bash
curl -X POST http://127.0.0.1:5050/api/choose \
  -H "Content-Type: application/json" \
  -d '{"tokens_estimate": 1000}'
```

### Check Status

```bash
curl http://127.0.0.1:5050/api/status
```

### Register Usage

```bash
curl -X POST http://127.0.0.1:5050/api/use \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "claude",
    "tokens_used": 1500,
    "success": true
  }'
```

---

## 🤝 Integration with Skynet Ecosystem

The Token Switcher is designed to work seamlessly with:

- **Skynet File Tagger**: Tag and track API usage per file
- **Skynet Context Injector**: Manage context within quota limits
- **Multi-Agent RAG Syncer**: Coordinate API calls across agents
- **Skynet Key Vault**: Secure key storage and rotation

---

## 📝 License

Part of the Skynet Intelligence Framework.

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Change port in run_switcher.py
app.run(port=5051)  # Use different port
```

### Database Locked
```bash
# Close all connections
rm data/tokens.db
# Restart application
```

### Flask Not Found
```bash
pip install flask flask-cors
```

---

## 🎯 Mission Accomplished

You now have a tactical API management system that:

✅ **Never** runs out of quota unexpectedly
✅ **Always** chooses the optimal provider
✅ **Monitors** usage in real-time
✅ **Logs** every API call
✅ **Switches** intelligently between providers
✅ **Provides** clean API for agent integration

**Welcome to intelligent quota management. Welcome to Skynet Token Switcher.** 🟣

---

## 📞 Support

For issues or enhancements, check the Skynet Depot repository.

**Built with precision. Powered by intelligence.** 💜
