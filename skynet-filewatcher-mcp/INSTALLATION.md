# 🚀 Guide d'Installation - Skynet FileWatcher MCP

Guide d'installation pas-à-pas pour mettre en place le serveur MCP FileWatcher.

## Prérequis

Avant de commencer, assurez-vous d'avoir :

- ✅ **Node.js** version 18 ou supérieure
- ✅ **npm** version 8 ou supérieure
- ✅ Accès en lecture au dossier que vous souhaitez surveiller
- ✅ Claude Code CLI ou Claude Desktop installé

### Vérifier les prérequis

```bash
node --version   # Doit afficher v18.x.x ou plus
npm --version    # Doit afficher 8.x.x ou plus
```

Si Node.js n'est pas installé ou est trop ancien :

```bash
# Sur Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Sur macOS avec Homebrew
brew install node

# Sur Windows avec Chocolatey
choco install nodejs
```

---

## Installation Étape par Étape

### 1. Récupérer le projet

```bash
# Naviguer vers le dossier du projet
cd /chemin/vers/Skynet_depot/skynet-filewatcher-mcp

# Ou cloner depuis Git
git clone https://github.com/flamstyl/Skynet_depot.git
cd Skynet_depot/skynet-filewatcher-mcp
```

### 2. Installer les dépendances

```bash
npm install
```

Cela installera :
- `@modelcontextprotocol/sdk` - SDK officiel MCP
- `chokidar` - Bibliothèque de surveillance de fichiers
- `uuid` - Génération d'identifiants uniques
- `zod` - Validation de schémas

### 3. Configurer le chemin de surveillance

Éditez le fichier `config.json` :

```bash
nano config.json
# ou
code config.json
# ou
vim config.json
```

Modifiez le `watchPath` pour pointer vers votre dossier :

```json
{
  "watchPath": "/home/VOTRE_USERNAME/Skynet_Drive_Core/",
  ...
}
```

**Important :** Remplacez `/home/VOTRE_USERNAME/` par le chemin réel sur votre système.

### 4. Tester l'installation

```bash
npm start
```

Vous devriez voir :

```
🚀 Démarrage de Skynet FileWatcher MCP Server...

📋 Configuration chargée:
   - Dossier surveillé: /home/raphael/Skynet_Drive_Core/
   - Fichier de log: /home/user/Skynet_depot/skynet-filewatcher-mcp/logs/events.jsonl
   - Calcul de hash: Activé

🚀 Démarrage de la surveillance sur: /home/raphael/Skynet_Drive_Core/
📝 Logs enregistrés dans: .../logs/events.jsonl
✅ Surveillance active et prête
✅ Serveur MCP démarré avec succès
📡 Écoute sur stdio pour les connexions MCP...
```

Arrêtez le serveur avec `Ctrl+C`.

---

## Intégration avec Claude

### Option A : Claude Code CLI

#### 1. Localiser le fichier de configuration

Le fichier de configuration MCP de Claude Code se trouve généralement à :

```bash
# Linux
~/.config/claude/mcp_config.json

# macOS
~/Library/Application Support/Claude/mcp_config.json

# Windows
%APPDATA%\Claude\mcp_config.json
```

#### 2. Créer ou éditer le fichier de configuration

```bash
# Linux/macOS
mkdir -p ~/.config/claude
nano ~/.config/claude/mcp_config.json
```

#### 3. Ajouter le serveur MCP

```json
{
  "mcpServers": {
    "skynet-filewatcher": {
      "command": "node",
      "args": ["/CHEMIN_ABSOLU/vers/skynet-filewatcher-mcp/index.js"],
      "env": {}
    }
  }
}
```

**IMPORTANT :** Remplacez `/CHEMIN_ABSOLU/` par le chemin réel sur votre système.

Exemple :
```json
{
  "mcpServers": {
    "skynet-filewatcher": {
      "command": "node",
      "args": ["/home/raphael/Skynet_depot/skynet-filewatcher-mcp/index.js"],
      "env": {}
    }
  }
}
```

#### 4. Redémarrer Claude Code

```bash
# Fermez et relancez Claude Code CLI
claude-code
```

### Option B : Claude Desktop

#### 1. Localiser le fichier de configuration

```bash
# macOS
~/Library/Application Support/Claude/claude_desktop_config.json

# Windows
%APPDATA%\Claude\claude_desktop_config.json
```

#### 2. Éditer la configuration

```json
{
  "mcpServers": {
    "skynet-filewatcher": {
      "command": "node",
      "args": ["/Users/raphael/skynet-filewatcher-mcp/index.js"]
    }
  }
}
```

#### 3. Redémarrer Claude Desktop

Fermez complètement l'application et relancez-la.

---

## Vérification de l'installation

### 1. Vérifier que le serveur MCP est connecté

Dans Claude, tapez :

```
Liste les outils MCP disponibles
```

Vous devriez voir apparaître :
- `detect_changes`
- `get_watch_status`
- `get_event_stats`
- `clean_old_events`
- `search_events`

### 2. Tester la surveillance

```
Utilise get_watch_status pour vérifier le statut du file watcher
```

Claude devrait retourner :

```json
{
  "success": true,
  "status": {
    "is_watching": true,
    "watch_path": "/home/raphael/Skynet_Drive_Core/",
    ...
  }
}
```

### 3. Créer un fichier de test

```bash
# Dans un autre terminal
echo "test" > /home/raphael/Skynet_Drive_Core/test_file.txt
```

Puis dans Claude :

```
Utilise detect_changes pour voir les derniers événements
```

Vous devriez voir l'événement de création du fichier.

---

## Installation globale (optionnel)

Pour pouvoir lancer le serveur depuis n'importe où :

```bash
cd skynet-filewatcher-mcp
npm install -g .
```

Vous pouvez maintenant utiliser :

```bash
skynet-filewatcher-mcp
```

---

## Configuration avancée

### Personnaliser les fichiers ignorés

Éditez `config.json` :

```json
{
  "options": {
    "ignored": [
      "**/node_modules/**",
      "**/.git/**",
      "**/*.log",
      "**/.DS_Store",
      "**/votre_pattern_perso/**"
    ]
  }
}
```

### Optimiser les performances

Pour surveiller un très grand nombre de fichiers :

```json
{
  "options": {
    "depth": 5,  // Limiter la profondeur
    "usePolling": false,  // Utiliser les événements natifs
    "interval": 100  // Intervalle de polling si nécessaire
  },
  "features": {
    "calculateHash": false  // Désactiver le hash pour plus de vitesse
  }
}
```

### Limiter l'espace disque

Nettoyer automatiquement les vieux logs :

```bash
# Ajouter un cron job (Linux/macOS)
crontab -e

# Ajouter cette ligne (nettoie les logs > 7 jours chaque nuit à 2h)
0 2 * * * node /chemin/vers/index.js --clean-old 168
```

---

## Dépannage

### Problème : "Cannot find module"

```bash
# Solution : Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Problème : Permission denied

```bash
# Solution : Vérifier les permissions
ls -la /home/raphael/Skynet_Drive_Core/

# Ou donner les permissions
chmod -R 755 /home/raphael/Skynet_Drive_Core/
```

### Problème : Le serveur ne démarre pas dans Claude

1. Vérifier le chemin absolu dans `mcp_config.json`
2. Tester le serveur manuellement : `node /chemin/vers/index.js`
3. Vérifier les logs de Claude : `~/.config/claude/logs/`

### Problème : Aucun événement détecté

1. Vérifier que `ignoreInitial: true` dans la config
2. Créer un nouveau fichier dans le dossier surveillé
3. Vérifier les logs : `tail -f logs/events.jsonl`

---

## Mise à jour

Pour mettre à jour vers une nouvelle version :

```bash
cd skynet-filewatcher-mcp
git pull origin main
npm install
npm start
```

---

## Désinstallation

Pour désinstaller complètement :

```bash
# Supprimer la référence dans mcp_config.json
nano ~/.config/claude/mcp_config.json
# (Supprimer la section "skynet-filewatcher")

# Désinstaller globalement (si installé)
npm uninstall -g skynet-filewatcher-mcp

# Supprimer le dossier
rm -rf /chemin/vers/skynet-filewatcher-mcp
```

---

## Support

Si vous rencontrez des problèmes :

1. Consultez la section [Dépannage du README](README.md#dépannage)
2. Vérifiez les [issues GitHub](https://github.com/flamstyl/Skynet_depot/issues)
3. Créez une nouvelle issue avec :
   - Votre version de Node.js (`node --version`)
   - Votre système d'exploitation
   - Les logs d'erreur complets
   - Le contenu de votre `config.json` (sans données sensibles)

---

**Félicitations ! 🎉**

Votre MCP FileWatcher est maintenant opérationnel. Claude peut désormais surveiller vos fichiers en temps réel !

Pour aller plus loin, consultez le [README principal](README.md) pour découvrir tous les cas d'usage possibles.
