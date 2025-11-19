# ⚡ Claude DevBox - Quick Start Guide

Bienvenue dans Claude DevBox ! Ce guide vous permet de démarrer en **5 minutes**.

## 🚀 Installation Ultra-Rapide

### Option 1 : Script automatique (Recommandé)

```bash
cd claude_devbox
bash scripts/quick-start.sh
```

Le script va :
- ✅ Vérifier les prérequis
- ✅ Installer les dépendances
- ✅ Builder le Docker sandbox
- ✅ Configurer le projet
- ✅ Démarrer les services

### Option 2 : Installation manuelle

```bash
# 1. Backend
cd server
npm install
cd ..

# 2. Frontend
cd editor
npm install
cd ..

# 3. Docker
cd docker
bash build.sh
cd ..

# 4. Démarrer
# Terminal 1
cd server && npm run dev

# Terminal 2
cd editor && npm run dev
```

## 🎮 Premier Test

1. **Ouvrir** http://localhost:5173

2. **Écrire du code** (exemple Python) :
```python
print("Hello from Claude DevBox!")
```

3. **Cliquer** sur le bouton **"Run"**

4. **Observer** les résultats dans les panneaux :
   - 📤 **stdout** : votre output
   - ❌ **stderr** : les erreurs éventuelles
   - 🐳 **Docker Console** : logs d'exécution

## 🔧 Configuration Rapide

Modifier `server/config.yaml` :

```yaml
autofix:
  enabled: true        # Auto-correction par Claude
  maxAttempts: 5       # Nombre max de tentatives

docker:
  memory: 512          # RAM allouée (MB)
  networkEnabled: true # Internet dans le sandbox
```

## 📚 Exemples de Code

### Python avec packages

```python
import requests

response = requests.get('https://api.github.com')
print(f"GitHub API Status: {response.status_code}")
```

**Note** : Le sandbox peut installer `requests` automatiquement !

### JavaScript avec npm

```javascript
const axios = require('axios');

(async () => {
  const res = await axios.get('https://api.github.com');
  console.log(`Status: ${res.status}`);
})();
```

### Code avec erreur → Auto-Fix

```python
# Code avec erreur volontaire
print("Hello"  # Manque la parenthèse fermante
```

**Résultat** :
1. Erreur détectée
2. Claude corrige automatiquement
3. Code re-exécuté
4. Succès ! ✓

## 🎯 Use Cases Rapides

### 1. Tester un script Python

```bash
curl -X POST http://localhost:3000/api/run \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"Hello\")",
    "language": "python"
  }'
```

### 2. Exécuter une commande shell

```bash
curl -X POST http://localhost:3000/api/exec \
  -H "Content-Type: application/json" \
  -d '{
    "command": "ls -la"
  }'
```

### 3. Tester sur Linux VM

```bash
curl -X POST http://localhost:3000/api/vm/test \
  -d '{
    "code": "print(\"Test Linux\")",
    "os": "linux",
    "language": "python"
  }'
```

## 🐛 Troubleshooting

### Backend ne démarre pas

```bash
# Vérifier les logs
cd server
npm run dev
```

**Erreur commune** : Docker non accessible
```bash
# Solution
sudo usermod -aG docker $USER
# Puis redémarrer la session
```

### Frontend ne se connecte pas au backend

**Vérifier** que le backend est démarré sur `http://localhost:3000`

```bash
curl http://localhost:3000/health
```

**Réponse attendue** :
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 123.45
}
```

### Sandbox Docker non trouvé

```bash
# Rebuilder l'image
cd docker
bash build.sh
```

## 📖 Prochaines Étapes

- 📚 Lire le [README complet](README.md)
- 🏗️ Voir l'[Architecture détaillée](docs/architecture.md)
- 💡 Explorer les [Prompts](docs/PROMPTS_COLLECTION.md)
- 🐳 Configurer les [VMs](vms/README.md) (optionnel)

## 🆘 Aide

**Problème ?** Ouvrir une issue sur GitHub :
https://github.com/flamstyl/Skynet_depot/issues

**Questions ?** Contact :
skynet.coalition@gmail.com

---

**Made with ⚡ by Skynet Coalition**
