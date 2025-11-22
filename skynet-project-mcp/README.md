# 📁 Skynet Project MCP

Serveur MCP pour Git workflow avancé, gestion de projets et scaffolding.

## 🎯 Fonctionnalités

### Git Workflow Complet (14 outils)

- `git_init` - Initialiser un dépôt
- `git_status` - Status détaillé
- `git_add` - Ajouter des fichiers
- `git_commit` - Créer un commit
- `git_branch_list` - Lister les branches
- `git_branch_create` - Créer une branche
- `git_checkout` - Changer de branche
- `git_merge` - Merger des branches
- `git_pull` - Pull depuis remote
- `git_push` - Push vers remote
- `git_add_remote` - Ajouter un remote
- `git_log` - Historique
- `git_diff` - Voir les différences
- `git_stash` - Stash push/pop/list

## 📦 Installation

```bash
cd skynet-project-mcp
npm install
npm run build
```

## 🔧 Configuration Claude Code

```json
{
  "mcp": {
    "servers": {
      "project": {
        "command": "node",
        "args": ["/chemin/vers/skynet-project-mcp/dist/index.js"]
      }
    }
  }
}
```

## 📖 Exemples

```
"Initialise un dépôt Git dans /home/user/mon-projet"
→ git_init avec path: "/home/user/mon-projet"

"Crée une branche feature/login"
→ git_branch_create avec branchName: "feature/login"

"Merge la branche develop dans main"
→ git_checkout avec branchName: "main"
→ git_merge avec branchName: "develop"

"Push vers origin main avec upstream"
→ git_push avec remote: "origin", branch: "main", setUpstream: true
```

## 📄 Licence

MIT - Skynet Depot © 2025
