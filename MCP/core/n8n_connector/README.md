# 🔗 n8n Connector — MCP Obsidian Core

## 📋 Vue d'ensemble

Le connecteur n8n permet de synchroniser automatiquement les événements MCP avec des services externes (Google Drive, Slack, Email, etc.).

---

## 🚀 Installation

### 1. Installer n8n

```bash
npm install -g n8n
```

### 2. Démarrer n8n

```bash
n8n start
```

n8n sera accessible à : http://localhost:5678

### 3. Importer le workflow

1. Ouvrir n8n dans votre navigateur
2. Cliquer sur "Import from File"
3. Sélectionner `flow.json`
4. Activer le workflow

---

## ⚙️ Configuration

### Webhook URL

Par défaut : `http://localhost:5678/webhook/mcp-webhook`

Pour changer l'URL, modifier dans `webhook.py` :

```python
N8N_WEBHOOK_URL = "https://your-n8n-instance.com/webhook/mcp-webhook"
```

### Credentials

Configurer dans n8n :

1. **Google Drive**
   - Settings → Credentials → Add Credential
   - Google Drive OAuth2 API
   - Autoriser l'accès

2. **Slack** (optionnel)
   - Settings → Credentials → Add Credential
   - Slack API
   - Configurer le token

---

## 🧪 Test de Connexion

```bash
cd MCP/core/n8n_connector
python webhook.py test
```

Vous devriez voir :
```
✅ Connexion n8n OK
```

---

## 📤 Envoyer un Événement

### Depuis Python

```python
from webhook import N8NConnector

connector = N8NConnector()

event = {
    "agent": "Claude",
    "file": "tasks.md",
    "event": "modified",
    "timestamp": "2025-11-21T14:30:00",
    "content": "..."
}

connector.send_event(event)
```

### Depuis la Ligne de Commande

```bash
python webhook.py event.json
```

---

## 🔄 Workflow n8n

Le workflow inclus fait :

1. **Webhook Trigger** : Reçoit les événements MCP
2. **Filter** : Filtre les événements "modified"
3. **Upload to Google Drive** : Sauvegarde les fichiers
4. **Notify Slack** : Envoie une notification
5. **Log** : Enregistre l'événement
6. **Response** : Retourne un statut

---

## 🎨 Personnalisation

### Ajouter un Nœud

1. Ouvrir le workflow dans n8n
2. Cliquer sur "+" pour ajouter un nœud
3. Exemples :
   - **Email** : Envoyer des notifications par email
   - **Telegram** : Bot Telegram
   - **Discord** : Webhook Discord
   - **Database** : Sauvegarder dans PostgreSQL/MongoDB
   - **HTTP Request** : Appeler une API externe

### Modifier le Filtre

Dans le nœud "Filter Modified Events", ajuster les conditions :

```javascript
// Exemple : Filtrer uniquement tasks.md
$json.file === "tasks.md" && $json.event === "modified"
```

---

## 📊 Monitoring

### Logs n8n

```bash
n8n start --output=logs
```

### Logs Python

Les logs sont dans :
- Console (stdout)
- Accessible via le dispatcher

---

## 🔐 Sécurité

### Webhook Authentification

Ajouter un header d'authentification dans `webhook.py` :

```python
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "your-secret-key"
}
```

Et dans n8n, configurer le Webhook pour vérifier le header.

### HTTPS

Pour la production, utiliser HTTPS :

```bash
n8n start --tunnel
```

Ou déployer sur :
- n8n Cloud
- VPS avec reverse proxy (nginx + Let's Encrypt)
- Docker avec HTTPS

---

## 🛠️ Dépannage

### Erreur "Connection refused"

- Vérifier que n8n est démarré
- Vérifier l'URL du webhook
- Vérifier le firewall

### Webhook ne reçoit rien

- Vérifier que le workflow est activé
- Vérifier l'URL dans `webhook.py`
- Consulter les logs n8n

### Credentials invalides

- Re-authentifier dans n8n
- Vérifier les permissions

---

## 📚 Ressources

- [Documentation n8n](https://docs.n8n.io/)
- [n8n Community](https://community.n8n.io/)
- [Workflows Examples](https://n8n.io/workflows/)

---

## 🚀 Exemples de Workflows

### Backup Automatique

```
Trigger (Schedule) → Read Files → Upload to Drive → Notify
```

### Rapport Quotidien

```
Trigger (Schedule) → Aggregate Logs → Generate Report → Send Email
```

### Alert sur Erreur

```
Webhook → Filter Errors → Send Telegram Alert
```

---

**Version** : 1.0.0
**Dernière mise à jour** : 2025-11-21
