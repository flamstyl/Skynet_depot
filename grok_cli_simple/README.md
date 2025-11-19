# 🤖 Grok CLI

**CLI conversationnel propulsé par Grok (xAI)** - Style Claude Code / Gemini CLI

Interface en ligne de commande pour discuter avec Grok, avec support intégré pour :
- 📁 Lecture/écriture de fichiers
- 💻 Exécution de commandes shell
- 🔌 Support MCP (serveurs externes)
- 🔄 Switch entre modèles Grok

---

## ✨ Features

- **Conversation naturelle** avec Grok
- **Outils intégrés** : fichiers, terminal, MCP
- **Switch de modèles** en temps réel
- **Streaming** des réponses
- **Interface Rich** avec markdown et syntax highlighting
- **Simple et léger** : ~500 lignes de code

---

## 🚀 Installation

### 1. Cloner / Copier

```bash
cd grok_cli_simple
```

### 2. Installer les dépendances

```bash
pip install -r requirements.txt
```

C'est tout ! Juste 2 dépendances : `httpx` et `rich`

### 3. Obtenir une clé API Grok

1. Va sur https://console.x.ai
2. Crée une clé API
3. Définis-la :

```bash
export XAI_API_KEY='xai-votre-clé-ici'
```

Ou ajoute-la à ton `.bashrc` / `.zshrc` :

```bash
echo 'export XAI_API_KEY="xai-votre-clé"' >> ~/.bashrc
source ~/.bashrc
```

---

## 💬 Utilisation

### Lancer le CLI

```bash
python grok.py
```

Tu devrais voir :

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🤖 Grok CLI                    ┃
┃ Modèle: grok-2-1212            ┃
┃ Projet: mon-projet             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

toi>
```

### Exemples de conversation

```
toi> Salut ! C'est quoi ce projet ?

grok> Salut ! Laisse-moi analyser...
[Grok liste les fichiers et explique]

toi> Lis le fichier README.md

grok> [Contenu du README]

toi> Execute `npm install`

grok> [Résultat de la commande]

toi> Crée un fichier test.py avec une fonction hello world

grok> [Crée le fichier et affiche le code]
```

### Commandes spéciales

- `/help` - Aide
- `/exit` - Quitter
- `/clear` - Effacer l'historique
- `/models` - Voir les modèles disponibles
- `/model <nom>` - Changer de modèle
- `/stats` - Statistiques

---

## 🎯 Modèles disponibles

```bash
toi> /models
```

Affiche :

```
Modèles Grok disponibles :
  [✓] grok-2-1212 - Grok 2 (Latest) - Le plus puissant
  [ ] grok-2-vision-1212 - Grok 2 Vision - Avec support d'images
  [ ] grok-beta - Grok Beta - Version bêta avec nouvelles features
```

Pour changer :

```bash
toi> /model grok-beta
✓ Modèle changé: Grok Beta
```

---

## 🔧 Configuration

Édite `config.yaml` pour personnaliser :

```yaml
# Modèle par défaut
model: grok-2-1212

# Paramètres de génération
generation:
  temperature: 0.7
  max_tokens: 4096
```

---

## 🛠️ Outils intégrés

### 1. Fichiers

Grok peut lire et écrire des fichiers automatiquement :

```
toi> Lis le fichier package.json
toi> Crée un fichier test.py avec une fonction
toi> Montre-moi le contenu de src/main.js
```

### 2. Terminal

Exécution de commandes shell :

```
toi> Execute `ls -la`
toi> Lance npm install
toi> Run pytest tests/
```

**Sécurité** : Les commandes dangereuses (`rm -rf /`, etc.) sont bloquées.

### 3. MCP (optionnel)

Support pour serveurs MCP externes (à configurer dans `config.yaml`).

---

## 📁 Structure

```
grok_cli_simple/
├── grok.py              # CLI principal
├── api/
│   └── grok_client.py   # Client API Grok
├── tools/
│   ├── terminal.py      # Exécution commandes
│   ├── files.py         # Gestion fichiers
│   └── mcp.py           # Support MCP
├── config.yaml          # Configuration
├── requirements.txt     # Dépendances
└── README.md            # Ce fichier
```

---

## 🔐 Sécurité

### Commandes bloquées

- `rm -rf /` et variantes
- `mkfs` (formatage disque)
- `dd if=` (écriture brute)
- Fork bombs

### Fichiers ignorés

- Binaires (`.exe`, `.bin`)
- Images / vidéos
- node_modules, .git, etc.

### Timeout

Commandes limitées à 30 secondes par défaut.

---

## 💡 Tips

### Historique de conversation

Grok garde l'historique de ta session. Pour recommencer à zéro :

```
toi> /clear
```

### Markdown dans les réponses

Grok formate automatiquement ses réponses avec :
- **Gras**, *italique*
- `Code inline`
- Blocs de code avec syntax highlighting
- Listes, tableaux, etc.

### Commandes dans le texte

Pour garantir l'exécution, mets les commandes entre backticks :

```
toi> Execute `git status`
```

---

## 🆚 Comparaison

| Feature | Grok CLI | Claude Code | Gemini CLI |
|---------|----------|-------------|------------|
| Conversation | ✅ | ✅ | ✅ |
| Fichiers | ✅ | ✅ | ✅ |
| Terminal | ✅ | ✅ | ✅ |
| MCP | ✅ | ✅ | ❌ |
| Modèle | Grok (xAI) | Claude | Gemini |
| Prix | $ | $$$ | $ |

---

## ❓ Troubleshooting

### "XAI_API_KEY non trouvée"

```bash
export XAI_API_KEY='ta-clé'
python grok.py
```

### "Module not found"

```bash
pip install -r requirements.txt
```

### "Erreur de connexion"

Vérifie que ta clé API est valide sur https://console.x.ai

---

## 🔮 Prochaines features

- [ ] Support d'images (Grok Vision)
- [ ] Historique persistant
- [ ] Complétion de commandes
- [ ] Plugins personnalisés
- [ ] Mode pair programming

---

## 📝 License

Open source - Utilise comme tu veux !

---

## 🙏 Credits

- **xAI** pour l'API Grok
- **Rich** pour le terminal UI
- **httpx** pour le client HTTP

---

**🤖 Développe avec Grok !**
