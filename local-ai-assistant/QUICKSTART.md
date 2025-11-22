# 🚀 Guide de démarrage rapide

Ce guide vous permet de démarrer l'assistant IA local en quelques minutes.

## ⚡ Démarrage rapide (5 minutes)

### Étape 1 : Prérequis

Assurez-vous d'avoir installé :
- Python 3.11+
- Node.js 18+
- Chrome/Chromium

### Étape 2 : Installation

```bash
# 1. Installer les dépendances du backend
cd backend
pip install -r requirements.txt

# 2. Configurer l'environnement
cp .env.example .env
# Éditez .env et ajoutez votre clé API OpenAI

# 3. Installer les dépendances du frontend
cd ../frontend
npm install
```

### Étape 3 : Démarrage

**Terminal 1 - Backend** :
```bash
cd backend
python main.py
```

**Terminal 2 - Frontend** :
```bash
cd frontend
npm run dev
```

### Étape 4 : Configuration initiale

1. **Récupérer le token** :
   - Regardez la console du backend
   - Notez le token affiché (ou visitez http://127.0.0.1:3333/api/auth/token)

2. **Configurer le frontend** :
   - Ouvrez http://localhost:5173
   - Allez dans **Paramètres**
   - Collez le token et sauvegardez
   - Entrez votre clé API OpenAI
   - Sauvegardez la configuration

3. **Configurer l'extension** :
   - Ouvrez `chrome://extensions/`
   - Activez le mode développeur
   - Chargez l'extension non empaquetée (`extension/`)
   - Cliquez sur l'icône et collez le token

### Étape 5 : Premier test

1. Retournez sur le dashboard (http://localhost:5173)
2. Tapez "Bonjour, peux-tu m'aider ?"
3. Appuyez sur Ctrl+Enter
4. L'IA devrait répondre ! 🎉

## 🐳 Avec Docker (encore plus rapide)

```bash
# 1. Créer le fichier .env
cp backend/.env.example backend/.env
# Éditez backend/.env avec vos clés API

# 2. Démarrer avec Docker
docker-compose up -d

# 3. Récupérer le token
docker-compose logs backend | grep "Token"
# Ou visitez http://127.0.0.1:3333/api/auth/token

# 4. Configurer comme ci-dessus
```

## ⚙️ Configuration minimale

Voici le minimum nécessaire dans `backend/.env` :

```env
# Clé API (au moins une)
OPENAI_API_KEY=sk-...

# Mot de passe pour le chiffrement (important !)
MASTER_PASSWORD=un-mot-de-passe-securise

# Le reste est optionnel
DEFAULT_PROVIDER=openai
DEFAULT_MODEL=gpt-4-turbo-preview
```

## 📝 Fonctionnalités à tester

### Dans le dashboard

✅ Chat simple : Posez n'importe quelle question
✅ Historique : Consultez vos anciennes conversations
✅ Paramètres : Changez de modèle, configurez vos préférences

### Avec l'extension Chrome

✅ Ouvrez n'importe quel site web
✅ Faites un clic-droit > "Résumer cette page"
✅ Sélectionnez du texte > Clic-droit > "Traduire en français"
✅ Appuyez sur Ctrl+M pour ouvrir le chat

## 🆘 Problèmes courants

### "Connection refused" sur le backend

**Cause** : Le backend n'est pas démarré
**Solution** :
```bash
cd backend
python main.py
```

### "Unauthorized" ou "Token invalide"

**Cause** : Token incorrect ou manquant
**Solution** : Récupérez le token sur http://127.0.0.1:3333/api/auth/token

### L'extension ne fonctionne pas

**Cause** : Extension non chargée ou backend inaccessible
**Solution** :
1. Vérifiez que le backend tourne
2. Rechargez l'extension sur `chrome://extensions/`
3. Vérifiez le token dans la popup

### "OpenAI API Error"

**Cause** : Clé API invalide ou quota dépassé
**Solution** : Vérifiez votre clé sur https://platform.openai.com/api-keys

## 🎯 Prochaines étapes

Une fois tout fonctionnel :

1. **Explorez les templates** : Testez la génération d'emails, de posts, etc.
2. **Activez la recherche web** : Dans les paramètres, activez le RAG
3. **Essayez Claude** : Ajoutez une clé Anthropic pour tester Claude
4. **Personnalisez** : Modifiez les prompts, ajustez la température, etc.

## 📚 Documentation complète

Pour aller plus loin, consultez le [README.md](README.md) complet qui contient :
- Architecture détaillée
- Toutes les fonctionnalités
- Guide de développement
- Déploiement en production
- Sécurité et confidentialité

## 💡 Astuces

- **Raccourcis clavier** : Ctrl+M ouvre le chat, Ctrl+Enter envoie un message
- **Mode sombre** : Détecté automatiquement selon votre système
- **WebSocket** : Les réponses sont streamées en temps réel
- **Chiffrement** : Toutes vos données sont chiffrées automatiquement

---

**Besoin d'aide ?** Ouvrez une issue sur GitHub ou consultez la documentation complète !
