# 🛠️ MCP Forge - AI Agent Builder

**Constructeur visuel d'agents IA personnalisés pour Skynet**

## 🎯 Objectif

Créer un écosystème vivant d'agents IA autonomes sans coder à la main. Interface drag & drop pour concevoir, configurer et déployer des agents intelligents.

## ✨ Fonctionnalités

### 🎨 Interface Visuelle
- **Drag & Drop Builder** : Conception intuitive d'agents IA
- **Model Selection** : Choix entre Claude, GPT-4, Gemini, Llama
- **Input/Output Configuration** : Définition des entrées/sorties
- **Trigger System** : Planification des cycles d'exécution (cron, events, webhooks)

### ⚙️ Configuration d'Agents
- **Role Definition** : Définition du rôle et persona de l'agent
- **Instructions** : Prompts et directives comportementales
- **Logic Flows** : Graphes de décision et workflows
- **Context Management** : Gestion de la mémoire et du contexte

### 🚀 Génération & Export
- **YAML/JSON Generator** : Export de configurations standardisées
- **n8n Integration** : Déploiement direct dans n8n/agents/
- **MCP Protocol** : Conformité au Model Context Protocol

### 🧪 Testing & Validation
- **Agent Preview** : Visualisation du comportement avant déploiement
- **Dry Run Testing** : Simulation d'exécution sans side-effects
- **AI Validation** : Analyse et amélioration par Claude/GPT
- **Performance Metrics** : Métriques de qualité et efficacité

## 🏗️ Architecture

```
mcp_forge/
├── app/
│   ├── __init__.py           # Flask app initialization
│   ├── server.py             # Flask server config
│   ├── config.py             # App configuration
│   ├── database.py           # SQLite database
│   ├── routes/               # API endpoints
│   │   ├── agent_routes.py   # Agent CRUD operations
│   │   ├── builder_routes.py # Visual builder API
│   │   ├── export_routes.py  # Export & deployment
│   │   └── validation_routes.py # AI validation
│   ├── services/             # Business logic
│   │   ├── agent_builder.py  # Agent construction
│   │   ├── config_generator.py # YAML/JSON generation
│   │   ├── ai_validator.py   # AI validation service
│   │   └── executor.py       # Dry run execution
│   └── models/               # Data models
│       ├── agent.py          # Agent schema
│       └── component.py      # Builder components
├── static/
│   ├── js/
│   │   ├── builder.js        # Drag & drop interface
│   │   ├── canvas.js         # Visual canvas
│   │   └── validator.js      # Client-side validation
│   └── css/
│       └── builder.css       # Builder styling
├── templates/
│   ├── builder.html          # Main builder interface
│   ├── preview.html          # Agent preview
│   └── dashboard.html        # Agents dashboard
├── data/
│   ├── agents/               # Saved agent configs
│   └── exports/              # Generated exports
└── run.py                    # Entry point
```

## 🚀 Installation

```bash
cd mcp_forge
pip install -r requirements.txt
python run.py
```

Accès : http://localhost:5002

## 📖 Utilisation

### 1. Créer un Agent
1. Ouvrir l'interface builder
2. Drag & drop des composants (triggers, actions, conditions)
3. Configurer le modèle IA et les paramètres
4. Définir les instructions et le rôle

### 2. Tester l'Agent
1. Preview du comportement
2. Dry run avec données de test
3. Validation IA pour amélioration

### 3. Déployer l'Agent
1. Générer la config YAML/JSON
2. Export vers n8n/agents/
3. Activer et monitorer

## 🔧 Configuration

### Agent Components
- **Triggers** : time, event, webhook, manual
- **Actions** : http_request, database, file_ops, ai_call
- **Conditions** : if/else, switch, loop, filter
- **Integrations** : n8n, MCP servers, APIs

### AI Models
- Claude 3.5 Sonnet
- GPT-4 Turbo
- Gemini Pro
- Llama 3

## 🌟 Exemples d'Agents

### 1. Code Reviewer
```yaml
agent:
  name: "code-reviewer"
  model: "claude-3-5-sonnet"
  trigger:
    type: "git-hook"
    event: "pull_request"
  instructions: "Analyser le code pour qualité, sécurité, performance"
  actions:
    - review_code
    - post_comments
    - suggest_improvements
```

### 2. Data Analyzer
```yaml
agent:
  name: "data-analyzer"
  model: "gpt-4-turbo"
  trigger:
    type: "cron"
    schedule: "0 */6 * * *"
  instructions: "Analyser les métriques et générer insights"
  actions:
    - fetch_data
    - analyze_trends
    - generate_report
```

## 🔗 Intégrations

- **n8n** : Workflows automation
- **MCP Servers** : Model Context Protocol
- **Skynet Command Center** : Monitoring central
- **Claude/GPT APIs** : AI validation

## 📊 Métrique de Qualité

- Validation syntaxique
- Validation sémantique
- Performance estimée
- Coût d'exécution
- Score de fiabilité

## 🛡️ Sécurité

- Sandboxing pour dry runs
- Validation des credentials
- Rate limiting
- Audit logging

## 📝 Licence

Part of Skynet Ecosystem
