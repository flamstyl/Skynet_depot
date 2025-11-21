# 🚀 QuickStart — MCP Obsidian Core

Démarrage rapide en 5 minutes !

---

## ⚡ Installation Express

```bash
# 1. Installer les dépendances
bash setup.sh

# 2. Démarrer le watcher (Terminal 1)
cd MCP/core/watcher
python3 watcher.py

# 3. Démarrer le dispatcher (Terminal 2)
cd MCP/core/watcher
python3 dispatcher.py --watch
```

**✅ Système opérationnel !**

---

## 🎯 Premier Test

### 1. Ajouter une tâche

Éditer `MCP/Claude/tasks.md` :

```markdown
- [ ] Ma première tâche test
```

**Sauvegardez le fichier.**

### 2. Observer les logs

Dans le terminal du **watcher** :
```
Événement détecté: Claude/tasks.md - modified
```

Dans le terminal du **dispatcher** :
```
Dispatch: Claude/tasks.md - modified
[Claude] Tasks modifiées - Analyse
[Claude] 1 tâche(s) en attente
```

### 3. Vérifier le journal

```bash
cat MCP/Claude/memory/journal_2025-11-21.md
```

Vous devriez voir l'événement loggé !

---

## 🧪 Tester le RAG

```bash
# Indexer un fichier
cd MCP/core/watcher
python3 rag_manager.py Claude index ../../Claude/context.md

# Rechercher
python3 rag_manager.py Claude search "infrastructure"

# Voir les stats
python3 rag_manager.py Claude stats
```

---

## 🔗 Tester n8n (optionnel)

### 1. Démarrer n8n

```bash
n8n start
```

Ouvrir : http://localhost:5678

### 2. Importer le workflow

1. Dans n8n : **Import from File**
2. Sélectionner : `MCP/core/n8n_connector/flow.json`
3. **Activate** le workflow

### 3. Activer dans rules.json

Éditer `MCP/core/watcher/rules.json` :

```json
{
  "n8n": {
    "enabled": true
  }
}
```

### 4. Tester

```bash
cd MCP/core/n8n_connector
python3 webhook.py test
```

---

## 📋 Cas d'Usage Complet

### Scénario : Traiter une tâche automatiquement

**1. Ajouter la tâche**

`MCP/Claude/tasks.md` :
```markdown
- [ ] Créer un script de backup
```

**2. Le watcher détecte**

Le fichier est modifié → événement généré

**3. Le dispatcher traite**

- Charge les directives
- Charge le contexte
- Identifie la tâche
- Log dans le journal

**4. Vérifier le résultat**

```bash
# Voir le journal
cat MCP/Claude/memory/journal_$(date +%Y-%m-%d).md

# Voir les événements
ls -la MCP/Claude/memory/events/
```

---

## 🎨 Personnaliser votre agent

### 1. Modifier les directives

`MCP/Claude/directives.md` :
```markdown
# Ajoutez vos propres règles
- Toujours écrire en français
- Privilégier Python pour les scripts
- Logger toutes les actions
```

### 2. Mettre à jour le contexte

`MCP/Claude/context.md` :
```markdown
## Mission Actuelle
Automatiser le backup quotidien du système
```

### 3. Ajouter des tâches

`MCP/Claude/tasks.md` :
```markdown
## Priorité 1
- [ ] Créer script backup
- [ ] Tester le script
- [ ] Planifier l'exécution cron
```

---

## 📊 Monitoring

### Logs en temps réel

```bash
# Watcher logs
tail -f MCP/core/watcher/watcher.log

# Dispatcher logs
tail -f MCP/core/watcher/dispatcher.log

# Journal de l'agent
tail -f MCP/Claude/memory/journal_$(date +%Y-%m-%d).md
```

---

## 🛑 Arrêter le système

```bash
# Dans chaque terminal : Ctrl+C

# Ou
pkill -f watcher.py
pkill -f dispatcher.py
```

---

## 🔧 Résolution de Problèmes

### Le watcher ne démarre pas

```bash
# Vérifier watchdog
pip install watchdog

# Vérifier les permissions
chmod +x MCP/core/watcher/watcher.py
```

### Le dispatcher ne traite pas les événements

```bash
# Vérifier le dossier events
ls -la MCP/Claude/memory/events/

# Vérifier rules.json
cat MCP/core/watcher/rules.json
```

### n8n ne reçoit rien

```bash
# Vérifier que n8n est démarré
curl http://localhost:5678

# Tester le webhook
python3 MCP/core/n8n_connector/webhook.py test
```

---

## 📚 Prochaines Étapes

1. **Lire la doc complète** : [README.md](core/README.md)
2. **Explorer le RAG** : Indexer vos fichiers importants
3. **Configurer n8n** : Synchroniser avec Google Drive
4. **Personnaliser** : Adapter à votre workflow

---

## 🎯 Exemples d'Utilisation

### Backup automatique

1. Tâche : `- [ ] Backup quotidien`
2. Le dispatcher détecte
3. Script créé dans `output/`
4. Synchronisé via n8n sur Drive

### Documentation automatique

1. Code modifié
2. Watcher détecte
3. RAG indexe
4. Documentation générée

### Collaboration multi-agents

1. Claude crée du code
2. Gemini analyse les perfs
3. GPT génère la doc
4. Tout synchronisé

---

**Système prêt ! Bon travail ! 🚀**

---

**Support** : Consulter [INSTALL.md](INSTALL.md) ou [README.md](core/README.md)
