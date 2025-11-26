# 🎯 Guide d'Intégration : Token Monitor + Copilot Premium Requests

## Vue d'ensemble

Ce guide explique comment intégrer le **Copilot Request Tracker** dans ton workflow pour tracker les **premium requests** GitHub Copilot et optimiser ta consommation.

---

## 🔧 Installation Rapide

### 1. Mettre à jour Token Monitor

```bash
cd C:\Users\rapha\IA\Skynet_depot\token_monitor_mcp
npm install
```

Le fichier `copilot_tracker.js` est déjà créé et prêt à l'emploi.

### 2. Modifier `server.js`

Ajouter l'import et initialisation :

```javascript
// Après les imports existants
const CopilotRequestTracker = require('./copilot_tracker');

// Dans la fonction main(), après initialisation de monitor
const copilotTracker = new CopilotRequestTracker(monitor, {
  plan: 'pro',        // 'free', 'pro', 'pro+', 'business', 'enterprise'
  monthlyLimit: 300,  // Free: 50, Pro: 300, Pro+: 1500
});

// Event listener pour dashboard updates
copilotTracker.on('premium_request_logged', (data) => {
  console.log(`📊 Premium Request #${data.count}/${data.limit} (${data.type})`);
  
  if (data.alerts.length > 0) {
    data.alerts.forEach(alert => console.log(alert.message));
  }
});

// Check reset mensuel au démarrage
if (copilotTracker.shouldResetMonthly()) {
  await copilotTracker.resetMonthly();
}
```

### 3. Ajouter nouveau MCP Tool

Dans `server.setRequestHandler(CallToolRequestSchema, ...)`, ajouter :

```javascript
case 'track_copilot_request': {
  const result = await copilotTracker.trackRequest({
    tool_name: args.tool_name,
    context: args.context,
    input_tokens: args.input_tokens || 0,
    output_tokens: args.output_tokens || 0,
    model: args.model || 'copilot-default'
  });
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result, null, 2)
    }]
  };
}

case 'get_copilot_stats': {
  const stats = copilotTracker.getStats();
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(stats, null, 2)
    }]
  };
}

case 'estimate_copilot_cost': {
  const estimate = copilotTracker.estimatePremiumRequests({
    tool_name: args.tool_name,
    context: args.context
  });
  
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(estimate, null, 2)
    }]
  };
}
```

### 4. Mettre à jour `ListToolsRequestSchema`

Ajouter les 3 nouveaux tools :

```javascript
{
  name: 'track_copilot_request',
  description: 'Track a Copilot premium request (chat, agent mode, code review, etc.)',
  inputSchema: {
    type: 'object',
    properties: {
      tool_name: { type: 'string', description: 'Name of the Copilot tool used' },
      context: { type: 'string', description: 'Context or description of the request' },
      input_tokens: { type: 'number', description: 'Number of input tokens' },
      output_tokens: { type: 'number', description: 'Number of output tokens' },
      model: { type: 'string', description: 'Model used (optional)' }
    },
    required: ['tool_name']
  }
},
{
  name: 'get_copilot_stats',
  description: 'Get current Copilot premium request statistics',
  inputSchema: {
    type: 'object',
    properties: {}
  }
},
{
  name: 'estimate_copilot_cost',
  description: 'Estimate premium requests needed for a Copilot operation',
  inputSchema: {
    type: 'object',
    properties: {
      tool_name: { type: 'string', description: 'Copilot tool to estimate' },
      context: { type: 'string', description: 'Description of the operation' }
    },
    required: ['tool_name', 'context']
  }
}
```

---

## 📊 Utilisation

### Via MCP Tools (dans Claude Code)

```javascript
// 1. Tracker une premium request
await mcp.callTool('token-monitor', 'track_copilot_request', {
  tool_name: 'copilot_chat',
  context: 'User asked: How to optimize this function?',
  input_tokens: 2500,
  output_tokens: 1200,
  model: 'claude-sonnet-4.5'
});

// 2. Voir stats
const stats = await mcp.callTool('token-monitor', 'get_copilot_stats');
console.log(stats);
// Output:
// {
//   plan: 'pro',
//   monthly_limit: 300,
//   current_count: 45,
//   remaining: 255,
//   percent_used: '15.0',
//   breakdown: {
//     chat: 30,
//     agent_mode: 10,
//     code_review: 5
//   },
//   projection: {
//     projected_total: 180,
//     will_exceed: false
//   }
// }

// 3. Estimer avant d'agir
const estimate = await mcp.callTool('token-monitor', 'estimate_copilot_cost', {
  tool_name: 'agent_mode',
  context: 'Create a complete REST API with authentication'
});
console.log(estimate);
// Output:
// {
//   estimated_requests: 5,
//   remaining: 255,
//   will_exceed: false,
//   warning: '✅ This operation will use 5 premium requests (250 remaining)'
// }
```

### Via HTTP API (dashboard ou scripts)

```bash
# Track request
curl -X POST http://localhost:3003/api/copilot/track \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "copilot_chat",
    "context": "Code review request",
    "input_tokens": 3000,
    "output_tokens": 1500
  }'

# Get stats
curl http://localhost:3003/api/copilot/stats

# Estimate cost
curl -X POST http://localhost:3003/api/copilot/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "agent_mode",
    "context": "Refactor entire project structure"
  }'
```

---

## 🎨 Dashboard Update

Ajouter section Premium Requests dans `dashboard/index.html` :

```html
<!-- Après la section Stats Grid -->
<div class="premium-section">
  <h2>🎯 Copilot Premium Requests</h2>
  
  <div class="premium-counter">
    <div class="counter-display">
      <span class="count" id="premium-count">0</span>
      <span class="separator">/</span>
      <span class="limit" id="premium-limit">300</span>
    </div>
    <div class="plan-badge" id="plan-badge">Pro</div>
  </div>

  <div class="progress-bar">
    <div class="progress-fill" id="premium-progress" style="width: 0%;"></div>
  </div>

  <div class="stats-row">
    <div class="stat-item">
      <span class="label">Remaining:</span>
      <span class="value" id="premium-remaining">300</span>
    </div>
    <div class="stat-item">
      <span class="label">Projected:</span>
      <span class="value" id="premium-projected">120</span>
    </div>
    <div class="stat-item">
      <span class="label">Extra Cost:</span>
      <span class="value cost" id="premium-extra-cost">$0.00</span>
    </div>
  </div>

  <div class="breakdown">
    <h3>Breakdown by Type</h3>
    <div class="breakdown-grid">
      <div class="breakdown-item">
        <span class="type">💬 Chat:</span>
        <span class="count" id="chat-count">0</span>
      </div>
      <div class="breakdown-item">
        <span class="type">🤖 Agent:</span>
        <span class="count" id="agent-count">0</span>
      </div>
      <div class="breakdown-item">
        <span class="type">🔍 Review:</span>
        <span class="count" id="review-count">0</span>
      </div>
      <div class="breakdown-item">
        <span class="type">🔧 Model:</span>
        <span class="count" id="model-count">0</span>
      </div>
    </div>
  </div>

  <div class="alerts" id="premium-alerts">
    <!-- Alerts dynamiques -->
  </div>
</div>

<style>
.premium-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 25px;
  border-radius: 12px;
  margin: 20px 0;
}

.premium-counter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.counter-display {
  font-size: 48px;
  font-weight: bold;
}

.plan-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
}

.progress-bar {
  background: rgba(255, 255, 255, 0.2);
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 20px;
}

.progress-fill {
  background: linear-gradient(90deg, #4CAF50 0%, #FFC107 70%, #F44336 90%);
  height: 100%;
  transition: width 0.3s ease;
}

.breakdown-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.breakdown-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 10px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
}

.alerts {
  margin-top: 20px;
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 8px;
}

.alert {
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 6px;
}

.alert.critical {
  background: #F44336;
}

.alert.warning {
  background: #FFC107;
  color: #333;
}

.alert.info {
  background: #2196F3;
}
</style>

<script>
// Auto-refresh premium stats
async function updatePremiumStats() {
  try {
    const response = await fetch('/api/copilot/stats');
    const stats = await response.json();
    
    document.getElementById('premium-count').textContent = stats.current_count;
    document.getElementById('premium-limit').textContent = stats.monthly_limit;
    document.getElementById('premium-remaining').textContent = stats.remaining;
    document.getElementById('premium-projected').textContent = stats.projection.projected_total;
    document.getElementById('premium-extra-cost').textContent = '$' + stats.projection.extra_cost;
    document.getElementById('plan-badge').textContent = stats.plan.toUpperCase();
    
    // Progress bar
    const progressBar = document.getElementById('premium-progress');
    progressBar.style.width = stats.percent_used + '%';
    
    // Breakdown
    document.getElementById('chat-count').textContent = stats.breakdown.chat;
    document.getElementById('agent-count').textContent = stats.breakdown.agent_mode;
    document.getElementById('review-count').textContent = stats.breakdown.code_review;
    document.getElementById('model-count').textContent = stats.breakdown.model_selection;
    
    // Alerts
    const alertsContainer = document.getElementById('premium-alerts');
    alertsContainer.innerHTML = '';
    stats.alerts.forEach(alert => {
      const alertDiv = document.createElement('div');
      alertDiv.className = `alert ${alert.level}`;
      alertDiv.innerHTML = `
        <div><strong>${alert.message}</strong></div>
        <div style="font-size: 0.9em; margin-top: 5px;">${alert.recommendation}</div>
      `;
      alertsContainer.appendChild(alertDiv);
    });
    
  } catch (error) {
    console.error('Failed to update premium stats:', error);
  }
}

// Refresh every 5 seconds
setInterval(updatePremiumStats, 5000);
updatePremiumStats();
</script>
```

---

## 🔧 Endpoints HTTP à ajouter dans `server.js`

```javascript
// Premium Requests endpoints
app.post('/api/copilot/track', async (req, res) => {
  try {
    const result = await copilotTracker.trackRequest(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/copilot/stats', (req, res) => {
  try {
    const stats = copilotTracker.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/copilot/estimate', (req, res) => {
  try {
    const estimate = copilotTracker.estimatePremiumRequests(req.body);
    res.json(estimate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/copilot/reset', async (req, res) => {
  try {
    await copilotTracker.resetMonthly();
    res.json({ success: true, message: 'Monthly reset completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📝 Exemple d'utilisation automatique

### Auto-tracking dans VS Code Extension

Si tu veux créer une extension VS Code pour tracker automatiquement :

```typescript
// extension.ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  
  // Hook Copilot Chat
  vscode.lm.onDidSendChatRequest(async (event) => {
    const inputTokens = estimateTokens(event.request.messages);
    
    // Appel Token Monitor
    await fetch('http://localhost:3003/api/copilot/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_name: 'copilot_chat',
        context: event.request.messages[0]?.content.substring(0, 200),
        input_tokens: inputTokens,
        model: event.model
      })
    });
  });

  // Hook Copilot Completions (gratuit mais on track quand même)
  vscode.languages.registerInlineCompletionItemProvider('*', {
    async provideInlineCompletionItems(document, position, context, token) {
      // Log completion (gratuit)
      await fetch('http://localhost:3003/api/log', {
        method: 'POST',
        body: JSON.stringify({
          input_tokens: 500,
          output_tokens: 100,
          tool_name: 'copilot_completion',
          context: 'Inline completion (free)'
        })
      });
    }
  });
}

function estimateTokens(messages: any[]): number {
  return messages.reduce((sum, msg) => {
    return sum + Math.ceil(msg.content.length / 4); // ~4 chars per token
  }, 0);
}
```

---

## 🎯 Quick Start Complet

```bash
# 1. Installer
cd C:\Users\rapha\IA\Skynet_depot\token_monitor_mcp
npm install

# 2. Tester le tracker
node
> const CopilotRequestTracker = require('./copilot_tracker');
> const tracker = new CopilotRequestTracker(null, { plan: 'pro' });
> tracker.trackRequest({ tool_name: 'copilot_chat', context: 'Test' });

# 3. Redémarrer server avec nouveau code
npm start

# 4. Tester l'API
curl http://localhost:3003/api/copilot/stats

# 5. Ouvrir dashboard
start http://localhost:3003/dashboard
```

---

## ✅ Checklist d'intégration

- [ ] `copilot_tracker.js` créé
- [ ] Modifier `server.js` (imports + init + tools)
- [ ] Ajouter 3 nouveaux MCP tools
- [ ] Ajouter 4 endpoints HTTP
- [ ] Mettre à jour dashboard HTML
- [ ] Tester manuellement
- [ ] Configurer auto-tracking (optionnel)

---

**Tu veux que je code les modifications dans `server.js` maintenant ?**
