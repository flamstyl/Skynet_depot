# 🔧 Troubleshooting

Guide de résolution des problèmes courants.

## Problèmes d'installation

### ❌ `npm install` échoue

**Symptômes** :
```
npm ERR! code EACCES
npm ERR! syscall access
```

**Solutions** :
1. Vérifier les permissions :
```bash
sudo chown -R $USER:$USER ~/.npm
```

2. Utiliser `npm` sans sudo :
```bash
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### ❌ Version de Node.js trop ancienne

**Symptômes** :
```
Error: Node.js version 18+ required
```

**Solutions** :
```bash
# Installer nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Installer Node.js 18
nvm install 18
nvm use 18
```

### ❌ Compilation TypeScript échoue

**Symptômes** :
```
error TS2307: Cannot find module '@modelcontextprotocol/sdk'
```

**Solutions** :
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Problèmes skynet-devops-mcp

### ❌ Docker : Cannot connect to Docker daemon

**Symptômes** :
```
Error: connect EACCES /var/run/docker.sock
```

**Solutions** :
1. Vérifier que Docker tourne :
```bash
sudo systemctl status docker
```

2. Ajouter l'utilisateur au groupe docker :
```bash
sudo usermod -aG docker $USER
newgrp docker
```

3. Vérifier le socket dans `.env` :
```env
DOCKER_SOCKET=/var/run/docker.sock
```

### ❌ systemd : systemctl not found

**Symptômes** :
```
Error: systemctl not found - systemd is required
```

**Solutions** :
- Sur WSL2, systemd n'est pas toujours disponible
- Alternative : utiliser `service` à la place
- Ou activer systemd dans WSL2 :
```bash
echo -e "[boot]\nsystemd=true" | sudo tee -a /etc/wsl.conf
wsl --shutdown
```

### ❌ Permission denied sur restart_service

**Symptômes** :
```
Error: Failed to restart service: Permission denied
```

**Solutions** :
1. Utiliser `sudo: true` :
```json
{
  "name": "restart_service",
  "arguments": {
    "serviceName": "nginx",
    "sudo": true
  }
}
```

2. Configurer sudoers pour permettre sans mot de passe :
```bash
sudo visudo
# Ajouter :
# user ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx
```

## Problèmes skynet-drive-memory-mcp

### ❌ Google Drive : Authentication failed

**Symptômes** :
```
AuthenticationError: No credentials found
```

**Solutions** :
1. Vérifier que `.env` contient `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`

2. Générer de nouveaux credentials :
   - https://console.cloud.google.com
   - APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client ID

3. Authentifier :
```bash
cd skynet-drive-memory-mcp
npm run dev
# Suivre les instructions d'authentification
```

### ❌ Embeddings : Model download fails

**Symptômes** :
```
Error: Failed to download model
```

**Solutions** :
1. Vérifier la connexion Internet

2. Vider le cache Hugging Face :
```bash
rm -rf ~/.cache/huggingface
```

3. Utiliser Cloudflare à la place :
```env
EMBEDDING_MODE=cloudflare
CLOUDFLARE_API_KEY=...
```

### ❌ RAG : Slow queries

**Symptômes** :
- Les requêtes RAG prennent >30 secondes

**Solutions** :
1. Activer le cache :
```env
CACHE_EMBEDDINGS=true
```

2. Limiter le nombre de fichiers :
```env
MAX_FILES_TO_SCAN=500
```

3. Filtrer par path ou mimeType :
```json
{
  "name": "query_rag",
  "arguments": {
    "query": "...",
    "path": "Skynet_Memory/2025",
    "mimeType": "text/plain"
  }
}
```

### ❌ Drive API quota exceeded

**Symptômes** :
```
Error: Quota exceeded for quota metric 'Read requests'
```

**Solutions** :
1. Attendre que le quota se réinitialise (quotidien)

2. Augmenter le quota dans Google Cloud Console :
   - APIs & Services → Google Drive API
   - Quotas → Request quota increase

3. Utiliser le cache pour réduire les appels :
```env
CACHE_EMBEDDINGS=true
```

## Problèmes Claude Code CLI

### ❌ MCP server not found

**Symptômes** :
```
Error: Server 'skynet-devops' not found
```

**Solutions** :
1. Vérifier la liste des servers :
```bash
claude mcp list
```

2. Ajouter le server manuellement :
```bash
claude mcp add skynet-devops \
  --transport stdio \
  --command 'node /chemin/absolu/vers/dist/index.js'
```

3. Vérifier le fichier de config :
```bash
cat ~/.config/Claude/claude_desktop_config.json
```

### ❌ Tool execution timeout

**Symptômes** :
```
Error: Tool execution timeout
```

**Solutions** :
1. Augmenter le timeout dans `.env` :
```env
COMMAND_TIMEOUT_MS=600000  # 10 minutes
```

2. Pour les opérations longues, lancer en arrière-plan

## Problèmes de logs

### Où trouver les logs ?

**Logs console** :
```bash
# DevOps MCP
tail -f /var/log/skynet-devops-mcp.log

# Drive Memory MCP
tail -f /var/log/skynet-drive-memory-mcp.log
```

**Logs Claude Code** :
```bash
# macOS
tail -f ~/Library/Logs/Claude/mcp.log

# Linux
tail -f ~/.config/Claude/logs/mcp.log
```

### ❌ Cannot write to log file

**Symptômes** :
```
Warning: Unable to write to log file
```

**Solutions** :
1. Créer le dossier de logs :
```bash
sudo mkdir -p /var/log
sudo chown $USER /var/log
```

2. Ou changer le chemin dans `.env` :
```env
LOG_FILE=./logs/skynet.log
```

## Problèmes de performance

### ❌ High CPU usage

**Causes possibles** :
- Embeddings en mode local (première utilisation)
- Trop de fichiers scannés pour le RAG
- Boucle infinie dans un script

**Solutions** :
1. Monitorer :
```bash
top -p $(pgrep node)
```

2. Limiter les ressources :
```env
MAX_FILES_TO_SCAN=100
```

3. Utiliser Cloudflare pour les embeddings :
```env
EMBEDDING_MODE=cloudflare
```

### ❌ High memory usage

**Solutions** :
1. Limiter la taille des fichiers :
```env
MAX_FILE_SIZE_MB=10
```

2. Réduire le cache :
```bash
rm -rf cache/*
```

## Obtenir de l'aide

### Avant de demander de l'aide

✅ Vérifier les logs
✅ Vérifier la configuration `.env`
✅ Tester avec des exemples simples
✅ Vérifier les permissions

### Rapporter un bug

Inclure :
- Version de Node.js (`node -v`)
- Système d'exploitation
- Fichiers `.env` (SANS les secrets !)
- Logs d'erreur complets
- Étapes pour reproduire

### Ressources

- 📚 [Documentation MCP officielle](https://modelcontextprotocol.io)
- 📖 [Guide d'utilisation](./USAGE.md)
- 📦 [Guide d'installation](./INSTALLATION.md)
- 🐙 [Issues GitHub](https://github.com/...)

---

**Problème non résolu ?** Ouvrir une issue avec un maximum de détails !
