# 🚀 Démarrage rapide — MCP Server

**Temps estimé : 5 minutes**

---

## Étape 1 : Installation (2 min)

```bash
# Vérifier Python 3.10+
python --version

# Installer les dépendances
pip install -r requirements.txt
```

---

## Étape 2 : Configuration (1 min)

```bash
# Copier le fichier de configuration
cp .env.example .env

# Éditer et changer la clé API
nano .env  # ou vim, code, etc.
```

**Important :** Changez `MCP_API_KEY` !

---

## Étape 3 : Lancement (1 min)

```bash
# Lancer le serveur
python main.py
```

Vous devriez voir :

```
🟣 MCP_Server — Skynet Local Bridge
════════════════════════════════════════════════════════════
🌐 Server: http://0.0.0.0:7860
📖 Documentation: http://localhost:7860/docs
🔑 API Key: Configured from .env
🔄 Auto-reload: True
════════════════════════════════════════════════════════════
```

---

## Étape 4 : Test (1 min)

**Dans un autre terminal :**

```bash
# Test de santé
curl http://localhost:7860/

# Test du terminal
curl -X POST http://localhost:7860/terminal/execute \
  -H "Content-Type: application/json" \
  -d '{
    "command": "echo Hello MCP!",
    "auth": "SKYNET_MCP_2025_SECURE_KEY"
  }'

# Test filesystem (lire ce fichier)
curl -X POST http://localhost:7860/filesystem/read \
  -H "Content-Type: application/json" \
  -d '{
    "path": "'$(pwd)'/README.md",
    "auth": "SKYNET_MCP_2025_SECURE_KEY"
  }'
```

---

## Étape 5 : Documentation interactive

Ouvrez dans votre navigateur :

**http://localhost:7860/docs**

Vous pouvez tester tous les endpoints directement depuis l'interface Swagger !

---

## ✅ C'est prêt !

Votre serveur MCP est maintenant opérationnel.

### Prochaines étapes :

1. **Connectez votre IA** (ChatGPT, Claude, etc.) en utilisant les endpoints HTTP
2. **Construisez le sandbox Docker** (optionnel) : `cd sandbox && docker build -t mcp-sandbox:latest .`
3. **Explorez la mémoire IA** : ajoutez des entrées avec `/memory/add`

---

## 🆘 Problèmes courants

### Port déjà utilisé

```bash
# Changer le port dans .env
MCP_PORT=8000
```

### Permission denied

```bash
# Donner les permissions au script sandbox
chmod +x sandbox/run_sandbox.sh
```

### Module not found

```bash
# Réinstaller les dépendances
pip install -r requirements.txt --force-reinstall
```

---

**Besoin d'aide ?** Consultez le [README.md](README.md) complet.
