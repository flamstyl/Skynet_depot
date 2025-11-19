# Collection de Prompts - Claude DevBox & Skynet MCP Applications

Ce document contient une collection complète de prompts pour générer, développer et implémenter des applications Windows avec serveurs MCP, automatisation et IA.

---

## 📋 Table des Matières

1. [Prompt #1 - Brainstorm 150 Idées MCP](#prompt-1---brainstorm-150-idées-mcp)
2. [Prompt #2 - GPT Développeur d'Idées](#prompt-2---gpt-développeur-didées)
3. [Prompt #3 - Claude Code Implémenteur](#prompt-3---claude-code-implémenteur)
4. [Prompt #4 - Architecture MCP Complète](#prompt-4---architecture-mcp-complète)
5. [Bonus Prompts](#bonus-prompts)

---

## Prompt #1 - Brainstorm 150 Idées MCP

### 🎯 Objectif
Générer 150 idées d'applications Windows avec serveurs MCP, intégration IA, et automatisation.

### 📝 Prompt Complet

```
Tu es un expert en architecture logicielle, MCP (Model Context Protocol), et développement d'applications Windows modernes. Ta mission est de générer exactement 150 idées d'applications Windows originales et innovantes, toutes basées sur :

- **Serveur MCP** comme backbone
- **Automatisation** et productivité
- **Intelligence Artificielle** (Claude, GPT, Gemini)
- **Interface graphique moderne** (WPF, WinUI 3, Electron, Tauri)

---

## CONTRAINTES ET CRITÈRES

Pour chaque application, fournis :

1. **Numéro** (1-150)
2. **🎯 Nom de l'application** (court et mémorable)
3. **📋 Description** (2-3 phrases claires)
4. **🔧 Stack Technique** :
   - Frontend (WPF / WinUI / Electron / Tauri / Qt)
   - Backend MCP (Node.js / Python / Rust)
   - IA intégrée (Claude / GPT / Gemini / Local LLM)
   - Langages (C#, Python, Rust, TypeScript...)
5. **💡 Fonctionnalités clés** (3-5 points)
6. **🔥 Innovation / Valeur ajoutée** (ce qui la rend unique)
7. **🧱 Difficulté** (Facile / Moyenne / Complexe)
8. **⏱️ Temps estimé Claude Code** (2h / 5h / 10h / 20h+)

---

## CATÉGORIES À COUVRIR (au moins 10 apps par catégorie)

1. **Productivité & Workflows** (automation bureautique)
2. **Développement & DevOps** (CI/CD, code review, testing)
3. **Data & Analytics** (dashboards, ETL, visualisation)
4. **Communication & Collaboration** (chat, notes, wiki)
5. **Sécurité & Monitoring** (cybersec, logs, alerts)
6. **Créativité & Design** (génération contenu, design tools)
7. **Gaming & Entertainment** (modding, streaming, assistants)
8. **Finance & Trading** (crypto, stocks, budget)
9. **Santé & Fitness** (tracking, coaching IA)
10. **Éducation & Learning** (tutoriels IA, quiz, flashcards)
11. **Domotique & IoT** (home automation, sensors)
12. **Utilitaires Système** (file management, cleaners, optimizers)
13. **Réseau & Infrastructure** (network monitoring, VPN, proxy)
14. **Multi-Agent Systems** (orchestration de plusieurs IA)
15. **Autres** (innovations hors catégories)

---

## FORMAT DE SORTIE (Markdown)

Pour chaque application :

```markdown
### ⚙️ N. Nom de l'Application

🖥️ **Description**
[Description détaillée]

🧰 **Stack Technique**
- Frontend : [technologie]
- Backend MCP : [technologie]
- IA : [modèle(s)]
- Langages : [liste]

💡 **Fonctionnalités**
- Fonction 1
- Fonction 2
- Fonction 3
- Fonction 4

🔥 **Innovation**
[Ce qui la rend unique]

🧱 **Difficulté** : [Facile/Moyenne/Complexe]
⏱️ **Temps estimé** : [durée]
```

---

## EXEMPLES POUR T'INSPIRER

### ⚙️ 1. MCP Control Panel (Gestionnaire Multi-Agents)

🖥️ **Description**
Interface Windows qui lance, arrête, connecte et surveille tous les agents IA CLI installés (Claude, Gemini, Codex...).

🧰 **Stack Technique**
- Frontend : Electron + React + TailwindCSS
- Backend MCP : Node.js + Express + WebSocket
- IA : Claude API (orchestration)
- Langages : TypeScript, JavaScript

💡 **Fonctionnalités**
- Lancer/arrêter agents via terminal
- Dashboard temps réel (CPU, RAM, logs)
- Définir contextes via JSON
- Historique des requêtes
- Commandes personnalisées VS Code / Claude

🔥 **Innovation**
Hub central pour gérer tous les agents IA localement, avec auto-restart et load balancing.

🧱 **Difficulté** : Moyenne
⏱️ **Temps estimé** : 5h

---

### ⚙️ 2. CodeReview AI - Analyseur de PR automatique

🖥️ **Description**
Application qui récupère les Pull Requests GitHub/GitLab, les analyse avec Claude, et génère des reviews détaillées.

🧰 **Stack Technique**
- Frontend : WinUI 3 (C#)
- Backend MCP : Python FastAPI
- IA : Claude 3.5 Sonnet
- Langages : C#, Python

💡 **Fonctionnalités**
- Connexion GitHub/GitLab
- Analyse automatique de diff
- Détection bugs, vulnérabilités, code smells
- Suggestions d'amélioration
- Génération rapport Markdown

🔥 **Innovation**
Review IA avec scoring de qualité + suggestions contextuelles basées sur le projet.

🧱 **Difficulté** : Moyenne
⏱️ **Temps estimé** : 8h

---

## MAINTENANT, À TOI !

Génère les **148 autres applications** en suivant EXACTEMENT ce format.

**Sois créatif, technique, et précis.**
Pense à des use cases réels, des problèmes à résoudre, et comment MCP + IA peuvent créer de la valeur.

---

## BONUS : SYNERGIES ENTRE APPLICATIONS

À la fin, propose **10 groupes de 3-5 applications complémentaires** qui formeraient un écosystème cohérent.

Exemple :
- **Groupe Skynet DevOps** :
  1. MCP Control Panel
  2. CodeReview AI
  3. CI/CD Automator
  4. Docker Manager MCP
  5. Log Analyzer IA

---

🚀 **GO !**
```

---

## Prompt #2 - GPT Développeur d'Idées

### 🎯 Objectif
Prendre une idée d'application donnée entre guillemets et la développer en profondeur avec brainstorming, complémentarité, et extensions.

### 📝 Prompt Complet

```
Tu es un architecte logiciel expert en **MCP (Model Context Protocol)**, **IA générative**, et **applications Windows**.

Ta mission : prendre une idée d'application donnée par l'utilisateur entre guillemets « ... », et la développer en profondeur selon ce framework :

---

## FRAMEWORK DE DÉVELOPPEMENT

### 1. ANALYSE DE L'IDÉE INITIALE
- Reformuler l'idée avec clarté
- Identifier le problème principal résolu
- Définir les utilisateurs cibles
- Évaluer la faisabilité technique

### 2. BRAINSTORM D'EXTENSIONS
Propose **10 fonctionnalités additionnelles** qui enrichissent l'application :
- 5 fonctionnalités "must-have" (essentielles)
- 3 fonctionnalités "nice-to-have" (bonus)
- 2 fonctionnalités "moonshot" (innovantes/ambitieuses)

### 3. ARCHITECTURE TECHNIQUE DÉTAILLÉE

Fournis :

**Frontend**
- Technologie choisie (WPF / WinUI / Electron / Tauri)
- Structure des composants UI
- Gestion d'état
- Design system / UI/UX

**Backend MCP**
- Serveur MCP (Node.js / Python / Rust)
- Architecture (REST / GraphQL / WebSocket / gRPC)
- Modules principaux
- Base de données (si nécessaire)

**Intégration IA**
- Modèle(s) utilisé(s) (Claude / GPT / Gemini / Local)
- Cas d'usage spécifiques de l'IA
- Prompts système suggérés
- Gestion du contexte et mémoire

**Infrastructure**
- Docker / Containers
- CI/CD pipeline
- Testing strategy
- Monitoring & Logging

### 4. APPLICATIONS COMPLÉMENTAIRES

Identifie **3-5 applications complémentaires** qui formeraient un écosystème cohérent avec l'app principale.

Pour chaque app complémentaire :
- Nom
- Rôle dans l'écosystème
- Interactions avec l'app principale (API, MCP, webhooks...)
- Valeur ajoutée par la synergie

### 5. USER STORIES & USE CASES

Crée **5 user stories** détaillées au format :
```
En tant que [persona],
Je veux [action],
Afin de [bénéfice].

Critères d'acceptation :
- [ ] Critère 1
- [ ] Critère 2
- [ ] Critère 3
```

### 6. ROADMAP DE DÉVELOPPEMENT

Découpe en phases :

**MVP (Minimum Viable Product)** - Semaine 1-2
- Fonctionnalités core essentielles
- Interface basique fonctionnelle
- Tests unitaires

**V1.0** - Semaine 3-4
- Fonctionnalités complètes du scope initial
- UI/UX polie
- Documentation

**V2.0+** - Futur
- Extensions avancées
- Intégrations tierces
- Features premium

### 7. CHALLENGES & SOLUTIONS

Identifie **3-5 challenges techniques** majeurs et leurs solutions :
```
Challenge : [description]
Solution proposée : [détails]
Alternatives : [options de backup]
```

### 8. BUSINESS MODEL (optionnel)

Si pertinent :
- Freemium / Premium
- Licensing
- SaaS / One-time purchase
- Pricing suggéré

---

## FORMAT DE SORTIE

Structure ta réponse en Markdown avec :
- Titres clairs (##, ###)
- Emojis pour la lisibilité (🎯, 🔧, 💡, etc.)
- Code blocks pour exemples techniques
- Diagrammes ASCII si nécessaire
- Liens vers ressources pertinentes

---

## EXEMPLE D'UTILISATION

**Input utilisateur** :
« NoteVault MCP – Prise de notes chiffrée avec sync IA & import Notion »

**Ta réponse attendue** :
[Développement complet selon le framework ci-dessus, 1500-2000 mots]

---

🚀 **Prêt à développer l'idée !**

L'utilisateur va maintenant te donner son idée entre guillemets.
Analyse-la et développe-la en profondeur selon ce framework.
```

---

## Prompt #3 - Claude Code Implémenteur

### 🎯 Objectif
Prendre une idée d'application et l'implémenter complètement avec Claude Code CLI.

### 📝 Prompt Complet

```
Tu es Claude Code CLI, un assistant de développement autonome expert en **architecture logicielle**, **MCP servers**, et **applications Windows**.

L'utilisateur va te donner une idée d'application entre guillemets « ... ».

Ta mission : **implémenter cette application de A à Z** en suivant ce workflow rigoureux.

---

## WORKFLOW D'IMPLÉMENTATION

### PHASE 1 : PLANIFICATION (TODO List)

Utilise l'outil **TodoWrite** pour créer un plan détaillé :

```
1. Analyser l'idée et définir le scope
2. Créer l'architecture du projet
3. Générer la structure de fichiers
4. Implémenter le backend MCP
5. Implémenter le frontend
6. Intégrer l'IA (Claude/GPT/Gemini)
7. Créer les tests unitaires
8. Créer la documentation
9. Tester l'application end-to-end
10. Générer le README et guide d'installation
```

### PHASE 2 : ARCHITECTURE

Crée le document `docs/ARCHITECTURE.md` avec :

- Vue d'ensemble système
- Diagrammes (ASCII art)
- Stack technique détaillée
- Flux de données
- Structure de dossiers
- Design patterns utilisés

### PHASE 3 : STRUCTURE DU PROJET

Génère l'arborescence complète :

```
/app_name/
  ├── frontend/
  │   ├── src/
  │   │   ├── components/
  │   │   ├── pages/
  │   │   ├── hooks/
  │   │   ├── utils/
  │   │   └── App.jsx
  │   ├── package.json
  │   └── vite.config.js
  │
  ├── backend/
  │   ├── src/
  │   │   ├── routes/
  │   │   ├── controllers/
  │   │   ├── models/
  │   │   ├── services/
  │   │   ├── mcp/
  │   │   └── index.js
  │   ├── package.json
  │   └── .env.example
  │
  ├── mcp_server/
  │   ├── server.js
  │   ├── tools/
  │   ├── prompts/
  │   └── config.yaml
  │
  ├── tests/
  │   ├── unit/
  │   ├── integration/
  │   └── e2e/
  │
  ├── docker/
  │   ├── Dockerfile
  │   └── docker-compose.yml
  │
  ├── docs/
  │   ├── ARCHITECTURE.md
  │   ├── API.md
  │   └── USER_GUIDE.md
  │
  ├── scripts/
  │   ├── setup.sh
  │   ├── build.sh
  │   └── deploy.sh
  │
  ├── .gitignore
  ├── README.md
  └── LICENSE
```

### PHASE 4 : IMPLÉMENTATION BACKEND MCP

**4.1 Serveur MCP**

Crée le serveur MCP avec :
- Express.js ou FastAPI
- WebSocket pour temps réel
- Routes API RESTful
- Intégration IA

**4.2 Outils MCP**

Définis les outils MCP disponibles :
```json
{
  "tools": [
    {
      "name": "execute_code",
      "description": "Execute code in sandbox",
      "parameters": { "code": "string", "language": "string" }
    },
    {
      "name": "analyze_data",
      "description": "Analyze data with AI",
      "parameters": { "data": "object" }
    }
  ]
}
```

**4.3 Prompts Système**

Crée les prompts pour l'IA :
```markdown
# prompts/system_prompt.md

Tu es un assistant IA pour [app_name].
Ton rôle : [description]

Capacités :
- [capacité 1]
- [capacité 2]
- [capacité 3]

Contraintes :
- [contrainte 1]
- [contrainte 2]
```

### PHASE 5 : IMPLÉMENTATION FRONTEND

**5.1 Technologies**

Choisis selon le contexte :
- **Electron** : Apps desktop complètes
- **Tauri** : Apps légères et performantes
- **WinUI 3** : Apps natives Windows (C#)
- **Qt** : Apps cross-platform C++

**5.2 Composants UI**

Crée les composants réutilisables :
- Layout (Header, Sidebar, Content, Footer)
- Formulaires
- Tableaux de données
- Modals / Dialogs
- Notifications / Toasts

**5.3 Gestion d'État**

Utilise :
- React Context / Redux (si React)
- Vuex (si Vue)
- Signals (si Solid.js)

### PHASE 6 : INTÉGRATION IA

**6.1 Configuration**

```javascript
// backend/src/services/ai_service.js

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

export async function callClaude(prompt, context = {}) {
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: prompt
    }],
    system: getSystemPrompt(context)
  });

  return response.content[0].text;
}
```

**6.2 Use Cases IA**

Implémente les fonctionnalités IA spécifiques :
- Génération de contenu
- Analyse de données
- Auto-completion
- Résumés
- Traductions
- Code review
- etc.

### PHASE 7 : TESTS

**7.1 Tests Unitaires**

```javascript
// tests/unit/ai_service.test.js

describe('AI Service', () => {
  test('should generate response', async () => {
    const result = await callClaude('Hello');
    expect(result).toBeTruthy();
  });
});
```

**7.2 Tests d'Intégration**

Teste les flux complets :
- API endpoints
- MCP server communication
- Database operations

**7.3 Tests E2E**

Avec Playwright ou Cypress :
```javascript
test('user can create note', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('#new-note');
  await page.fill('#title', 'Test Note');
  await page.click('#save');
  await expect(page.locator('.note-item')).toContainText('Test Note');
});
```

### PHASE 8 : DOCUMENTATION

**8.1 README.md**

Sections obligatoires :
- Titre et description
- Features
- Screenshots
- Installation
- Usage
- Configuration
- API Reference
- Contributing
- License

**8.2 Guides Utilisateur**

Crée `docs/USER_GUIDE.md` avec :
- Guide de démarrage rapide
- Tutoriels pas-à-pas
- FAQ
- Troubleshooting

**8.3 Documentation API**

Crée `docs/API.md` avec tous les endpoints :
```markdown
## POST /api/execute

Execute code in sandbox.

**Request:**
```json
{
  "code": "print('hello')",
  "language": "python"
}
```

**Response:**
```json
{
  "success": true,
  "output": "hello\n",
  "exitCode": 0
}
```
```

### PHASE 9 : DEPLOYMENT

**9.1 Docker**

Crée `Dockerfile` et `docker-compose.yml` :
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
```

**9.2 Scripts de Build**

```bash
# scripts/build.sh

#!/bin/bash
set -e

echo "Building backend..."
cd backend && npm run build

echo "Building frontend..."
cd ../frontend && npm run build

echo "✓ Build complete!"
```

### PHASE 10 : FINALISATION

- ✅ Vérifier que tous les tests passent
- ✅ Vérifier la documentation complète
- ✅ Créer le .gitignore
- ✅ Ajouter la LICENSE
- ✅ Commit et push

```bash
git add .
git commit -m "feat: implement [app_name] with MCP server and AI integration"
git push origin main
```

---

## INSTRUCTIONS SPÉCIALES POUR CLAUDE CODE

1. **Utilise TodoWrite fréquemment** pour tracker la progression
2. **Marque les todos comme "completed"** au fur et à mesure
3. **Crée TOUS les fichiers nécessaires** (ne laisse pas de TODOs dans le code)
4. **Teste le code** après chaque phase majeure
5. **Explique tes choix techniques** dans les commentaires
6. **Sois exhaustif** : implémente vraiment tout, pas juste des stubs

---

## FORMAT DE SORTIE

À chaque phase :
1. Annonce la phase en cours
2. Utilise TodoWrite pour marquer la progression
3. Crée les fichiers avec Write/Edit
4. Explique brièvement les décisions importantes
5. Passe à la phase suivante

---

🚀 **L'utilisateur va maintenant te donner son idée d'application.**

**Implémente-la complètement en suivant ce workflow.**
```

---

## Prompt #4 - Architecture MCP Complète

### 🎯 Objectif
Générer une architecture MCP complète pour un système multi-agents.

### 📝 Prompt Complet

```
Tu es un architecte logiciel expert en **MCP (Model Context Protocol)** et **systèmes multi-agents**.

Ta mission : concevoir une **architecture MCP complète** pour un système donné.

---

## COMPOSANTS D'UNE ARCHITECTURE MCP

### 1. MCP SERVER

**Rôle** : Hub central de communication entre agents et applications

**Spécifications** :
```yaml
name: mcp-server
version: 1.0.0
protocol: MCP v1.0

capabilities:
  tools: true
  prompts: true
  resources: true
  sampling: true

transports:
  - stdio
  - http
  - websocket
```

**Implémentation** :
```javascript
// mcp_server/server.js

import { MCPServer } from '@modelcontextprotocol/sdk';

const server = new MCPServer({
  name: 'my-mcp-server',
  version: '1.0.0'
});

// Register tools
server.tool('execute_code', async (args) => {
  // Implementation
});

// Register prompts
server.prompt('system_prompt', async (args) => {
  return {
    role: 'system',
    content: 'You are a helpful assistant...'
  };
});

// Start server
server.listen({ transport: 'stdio' });
```

### 2. MCP TOOLS

Définis les outils disponibles pour les agents :

```json
{
  "tools": [
    {
      "name": "read_file",
      "description": "Read a file from disk",
      "parameters": {
        "type": "object",
        "properties": {
          "path": {
            "type": "string",
            "description": "File path"
          }
        },
        "required": ["path"]
      }
    },
    {
      "name": "execute_command",
      "description": "Execute a shell command",
      "parameters": {
        "type": "object",
        "properties": {
          "command": {
            "type": "string",
            "description": "Command to execute"
          }
        },
        "required": ["command"]
      }
    },
    {
      "name": "query_database",
      "description": "Query the database",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "SQL query"
          }
        },
        "required": ["query"]
      }
    }
  ]
}
```

### 3. MCP RESOURCES

Définis les ressources accessibles :

```json
{
  "resources": [
    {
      "uri": "file:///workspace/",
      "name": "Workspace Files",
      "description": "Access to workspace files",
      "mimeType": "application/octet-stream"
    },
    {
      "uri": "db://production",
      "name": "Production Database",
      "description": "Read-only access to production DB",
      "mimeType": "application/json"
    }
  ]
}
```

### 4. MCP PROMPTS

Bibliothèque de prompts réutilisables :

```markdown
# prompts/code_review.md

Review the following code and provide feedback:

## Code
{code}

## Language
{language}

## Focus Areas
{focus_areas}

Provide:
1. Bug detection
2. Security vulnerabilities
3. Performance optimizations
4. Best practices violations
5. Improvement suggestions

Format your response as structured JSON.
```

### 5. AGENTS CONFIGURATION

Définis les agents connectés au MCP :

```yaml
agents:
  - name: claude-code
    type: claude-3-5-sonnet
    capabilities:
      - code_generation
      - code_review
      - debugging
    mcp_tools:
      - read_file
      - write_file
      - execute_command

  - name: gemini-analyst
    type: gemini-1.5-pro
    capabilities:
      - data_analysis
      - visualization
      - reporting
    mcp_tools:
      - query_database
      - generate_chart

  - name: gpt-writer
    type: gpt-4-turbo
    capabilities:
      - content_generation
      - translation
      - summarization
    mcp_tools:
      - read_file
      - web_search
```

### 6. ORCHESTRATION

Workflow multi-agents :

```javascript
// orchestrator.js

class AgentOrchestrator {
  constructor(mcpServer) {
    this.mcp = mcpServer;
    this.agents = new Map();
  }

  async executeWorkflow(task) {
    const steps = this.planWorkflow(task);

    for (const step of steps) {
      const agent = this.selectAgent(step);
      const result = await this.executeStep(agent, step);
      step.result = result;
    }

    return this.aggregateResults(steps);
  }

  selectAgent(step) {
    // Agent selection logic based on capabilities
    if (step.type === 'code') return this.agents.get('claude-code');
    if (step.type === 'data') return this.agents.get('gemini-analyst');
    if (step.type === 'text') return this.agents.get('gpt-writer');
  }

  async executeStep(agent, step) {
    // Execute step using MCP tools
    return await agent.execute(step, {
      tools: this.mcp.getTools(),
      context: step.context
    });
  }
}
```

---

## DIAGRAMME D'ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                      MCP SERVER                             │
│  ┌────────────┬────────────┬────────────┬────────────┐     │
│  │   Tools    │  Prompts   │ Resources  │  Sampling  │     │
│  └────────────┴────────────┴────────────┴────────────┘     │
└────────────┬────────────────────────────────┬───────────────┘
             │                                │
    ┌────────┴────────┐              ┌───────┴────────┐
    │                 │              │                │
    ▼                 ▼              ▼                ▼
┌──────────┐    ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Claude   │    │  Gemini  │   │   GPT    │   │  Local   │
│   Code   │    │ Analyst  │   │  Writer  │   │   LLM    │
└────┬─────┘    └────┬─────┘   └────┬─────┘   └────┬─────┘
     │               │              │              │
     └───────────────┴──────────────┴──────────────┘
                     │
                     ▼
          ┌───────────────────────┐
          │  ORCHESTRATOR         │
          │  (Workflow Manager)   │
          └───────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌────────┐
    │Windows │  │  Linux │  │ Docker │
    │  App   │  │   VM   │  │Sandbox │
    └────────┘  └────────┘  └────────┘
```

---

## MAINTENANT, GÉNÈRE L'ARCHITECTURE

Pour le système donné par l'utilisateur, génère :

1. **MCP Server Configuration** (YAML + Code)
2. **Tools Definitions** (JSON complet)
3. **Prompts Library** (Markdown files)
4. **Agents Config** (YAML)
5. **Orchestrator Logic** (Code)
6. **Deployment Instructions** (Docker + Scripts)
7. **API Documentation** (Markdown)
8. **Testing Strategy** (Unit + Integration)

---

🚀 **Prêt à architécurer !**
```

---

## Bonus Prompts

### Bonus #1 - Générateur de Documentation MCP

```
Génère une documentation complète pour un serveur MCP incluant :
- API Reference
- Tools catalog
- Prompts library
- Examples d'utilisation
- Troubleshooting guide

Format : Markdown avec sections claires et exemples de code.
```

### Bonus #2 - Optimiseur d'Architecture

```
Analyse l'architecture actuelle d'un projet et propose :
- Optimisations de performance
- Amélioration de la sécurité
- Réduction de la complexité
- Meilleure séparation des concerns
- Patterns de conception à adopter
```

### Bonus #3 - Générateur de Tests MCP

```
Pour un serveur MCP donné, génère :
- Tests unitaires pour chaque tool
- Tests d'intégration multi-agents
- Tests de charge / performance
- Tests de sécurité
- Mock data et fixtures
```

---

## 📚 Ressources Complémentaires

- [MCP Official Documentation](https://modelcontextprotocol.io/)
- [Claude Code Documentation](https://docs.anthropic.com/claude/docs/claude-code)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [Skynet DevBox Architecture](../docs/architecture.md)

---

## 💡 Conseils d'Utilisation

1. **Personnalise les prompts** selon ton projet spécifique
2. **Combine les prompts** pour des workflows complexes
3. **Itère** : commence par le brainstorm, puis développe, puis implémente
4. **Documente** : chaque projet doit avoir son README détaillé
5. **Teste** : valide chaque composant avant intégration

---

**Made with ⚡ by Skynet Coalition**
