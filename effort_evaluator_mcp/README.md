# 💰 Effort Evaluator MCP

**MCP Server pour évaluer l'effort en tokens de différentes approches**

Permet à Claude Code CLI et VS Code Copilot d'évaluer le coût en tokens de différentes stratégies avant de les exécuter, pour éviter de gaspiller du crédit.

---

## 🎯 Problème résolu

Quand un agent AI (Claude, Copilot) doit accomplir une tâche, il existe souvent plusieurs chemins possibles. Certains consomment beaucoup de tokens inutilement.

Ce MCP permet de :
- **Évaluer** plusieurs approches avant de les exécuter
- **Comparer** leur coût en tokens
- **Recommander** la plus efficace
- **Optimiser** l'approche actuelle

---

## ✨ Outils disponibles

### 1. `evaluate_effort`

Compare plusieurs approches et recommande la meilleure.

**Exemple :**
```json
{
  "task": "Créer un système d'authentification",
  "approaches": [
    {
      "name": "Approche 1: Tout générer d'un coup",
      "steps": [
        {
          "operation": "generate_full_feature",
          "details": "Système auth complet",
          "size": "large"
        }
      ]
    },
    {
      "name": "Approche 2: Incrémental",
      "steps": [
        {
          "operation": "generate_simple",
          "details": "Modèle User"
        },
        {
          "operation": "generate_simple",
          "details": "Routes auth"
        },
        {
          "operation": "generate_simple",
          "details": "Middleware JWT"
        }
      ]
    }
  ]
}
```

**Résultat :**
```
🏆 RECOMMANDÉ: Approche 2 (1500 tokens vs 5000 tokens)
💰 Économie: 3500 tokens (70%)
```

---

### 2. `estimate_operation`

Estime le coût d'une opération unique.

**Exemple :**
```json
{
  "operation": "read_file",
  "size": "large",
  "details": "fichier de 800 lignes"
}
```

**Résultat :**
```
Coût estimé: 2000 tokens
```

---

### 3. `suggest_optimization`

Suggère des optimisations pour réduire le coût.

**Exemple :**
```json
{
  "current_approach": [
    { "operation": "analyze_codebase", "size": "large" },
    { "operation": "generate_full_feature", "size": "large" }
  ]
}
```

**Résultat :**
```
💡 Suggestions:
1. analyze_codebase → search_project avec patterns ciblés
   Économie: ~1200 tokens
2. generate_full_feature → Décomposer en plusieurs generate_simple
   Économie: ~2000 tokens

💰 Économie potentielle: ~3200 tokens (45%)
```

---

## 🚀 Installation

```bash
cd effort_evaluator_mcp
npm install
```

---

## 💬 Utilisation

### Avec Claude Code CLI

Ajouter dans `~/.config/claude/config.json` :

```json
{
  "mcpServers": {
    "effort-evaluator": {
      "command": "node",
      "args": ["/path/to/effort_evaluator_mcp/src/server.js"]
    }
  }
}
```

### Avec VS Code Copilot

Ajouter dans `.vscode/settings.json` :

```json
{
  "mcp.servers": {
    "effort-evaluator": {
      "command": "node",
      "args": ["${workspaceFolder}/../effort_evaluator_mcp/src/server.js"]
    }
  }
}
```

---

## 📊 Estimation des coûts

| Opération | Small | Medium | Large |
|-----------|-------|--------|-------|
| read_file | 100 | 500 | 2000 |
| write_file | 200 | 800 | 3000 |
| generate_code | 500 | 2000 | 5000 |
| analyze_codebase | - | 1500 | - |
| fix_error | - | 800 | - |

---

## 🎓 Exemples d'utilisation

### Exemple 1: Choix d'approche

```
User: Je dois ajouter un système de pagination. Quelle est la meilleure approche ?

Claude: Laisse-moi évaluer les options...
[Appelle evaluate_effort avec 3 approches]

Résultat:
🏆 Approche recommandée: "Modifier fichiers existants" (600 tokens)
vs "Générer nouveau système" (3500 tokens)

💰 Économie: 2900 tokens (83%)
```

### Exemple 2: Optimisation

```
User: Je vais analyser tout le codebase puis générer la feature complète

Claude: [Appelle suggest_optimization]

💡 Optimisations suggérées:
1. Au lieu d'analyser tout le codebase (1500 tokens)
   → Recherche ciblée sur les fichiers pertinents (300 tokens)

2. Au lieu de générer feature complète (5000 tokens)
   → Génération incrémentale en 3 parties (1500 tokens total)

💰 Économie: 4700 tokens (72%)
```

---

## 🔧 Personnalisation

Éditer `src/server.js` pour ajuster les coûts estimés :

```javascript
const OPERATION_COSTS = {
  read_file_small: 100,
  read_file_medium: 500,
  // ... personnaliser selon votre usage
};
```

---

## 🎯 Cas d'usage principaux

1. **Comparaison d'approches** avant de démarrer une tâche
2. **Validation d'efficacité** d'une stratégie proposée
3. **Optimisation** d'un plan existant
4. **Apprentissage** des coûts réels des opérations

---

## 📝 License

MIT - Skynet Coalition

---

**💰 Économisez vos tokens, optimisez vos approches !**
