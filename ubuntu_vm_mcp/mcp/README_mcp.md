# 📁 MCP Directory - Model Context Protocol Scripts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎯 Vue d'ensemble

Le répertoire `/opt/mcp/` contient l'ensemble des **scripts d'orchestration et d'automatisation** pour l'environnement IA Ubuntu VM. Ces scripts permettent de gérer l'installation, la surveillance et le lancement d'agents IA comme Claude CLI, Ollama, Gemini CLI, etc.

## 📋 Scripts disponibles

### 🔧 `install.sh` - Installation des outils IA

**Rôle:** Installer tous les outils et dépendances nécessaires pour les agents IA.

**Contenu:**
- Mise à jour du système Ubuntu
- Installation de paquets Python (anthropic, openai, google-generativeai)
- Installation de Claude CLI (wrapper ou CLI officiel)
- Installation d'Ollama (LLM local)
- Installation de Gemini CLI (wrapper Python)
- Installation d'outils graphiques (GIMP, Inkscape, ImageMagick, FFmpeg)
- Installation de Docker CLI
- Configuration de l'environnement (`~/.ai_env`)

**Utilisation:**
```bash
bash /opt/mcp/install.sh
```

**Post-installation:**
1. Éditer `~/.ai_env` pour configurer vos clés API
2. Sourcer l'environnement: `source ~/.ai_env`
3. Tester les outils: `claude-test`, `ollama list`, `gemini-cli "test"`

---

### 👁️ `watcher.sh` - Surveillance de fichiers

**Rôle:** Surveiller les répertoires `/opt/mcp/` et `/data/` pour détecter les changements de fichiers et déclencher des actions automatiques.

**Fonctionnalités:**
- Surveillance en temps réel avec `inotifywait`
- Détection des événements: création, modification, suppression, déplacement
- Actions personnalisables selon le type de fichier
- Logging dans `/tmp/mcp_watcher.log`

**Événements surveillés:**
- `CREATE` - Nouveau fichier créé
- `CLOSE_WRITE` - Fichier modifié et fermé
- `DELETE` - Fichier supprimé
- `MOVED_TO` / `MOVED_FROM` - Fichier déplacé

**Utilisation:**
```bash
# Lancement en avant-plan (mode debug)
bash /opt/mcp/watcher.sh

# Lancement en arrière-plan
bash /opt/mcp/watcher.sh &

# Arrêter le watcher
pkill -f watcher.sh
```

**Extensions possibles (TODOs):**
- Analyse automatique de nouveaux fichiers avec Claude
- Indexation pour recherche full-text
- Synchronisation cloud (S3, Google Drive)
- Notifications webhook
- Tests automatiques sur modification de code
- Snapshots de `/data/`

---

### 🚀 `start.sh` - Point d'entrée principal

**Rôle:** Script de démarrage automatique appelé au boot du conteneur. Initialise l'environnement et les services IA.

**Actions effectuées:**
1. Chargement des variables d'environnement (`~/.ai_env`)
2. Vérification des répertoires MCP et DATA
3. Démarrage du serveur Ollama (si installé)
4. Configuration du watcher (désactivé par défaut)
5. Affichage des instructions de démarrage

**Utilisation:**
```bash
bash /opt/mcp/start.sh
```

**Appelé automatiquement:** Ce script est exécuté par `/entrypoint.sh` au démarrage du conteneur.

**Extensions possibles (TODOs):**
- Healthcheck des services
- Lancement automatique d'agents au boot
- Configuration de tâches cron
- Initialisation de bases de données
- Démarrage d'un serveur web de contrôle
- Synchronisation git au démarrage

---

### 🤖 `start-agent.sh` - Lanceur d'agents IA

**Rôle:** Menu interactif pour lancer différents agents IA.

**Agents disponibles:**

#### 1️⃣ **Claude CLI (Anthropic)**
- Mode CLI natif (si `claude` est installé)
- Mode wrapper Python interactif (fallback)
- Nécessite: `ANTHROPIC_API_KEY`

#### 2️⃣ **Ollama (LLM local)**
- Serveur Ollama démarré automatiquement
- Liste des modèles disponibles
- Lancement interactif de modèles (llama2, mistral, etc.)

#### 3️⃣ **Gemini CLI (Google)**
- Wrapper Python interactif
- Nécessite: `GEMINI_API_KEY` ou `GOOGLE_API_KEY`

#### 4️⃣ **Mode Python interactif**
- Shell Python avec tous les SDK IA pré-importés
- `anthropic`, `openai`, `google-generativeai`

#### 5️⃣ **Tous les services**
- Démarrage de tous les services en arrière-plan

**Utilisation:**
```bash
bash /opt/mcp/start-agent.sh
```

**Exemple de session:**
```bash
$ bash /opt/mcp/start-agent.sh

🎯 Sélectionnez l'agent IA à lancer:

  1) Claude CLI (Anthropic)
  2) Ollama (Local LLM)
  3) Gemini CLI (Google)
  4) Mode interactif Python
  5) Tous
  0) Quitter

Votre choix [1-5]: 1

🤖 Lancement de Claude CLI...
Vous > Bonjour Claude!
Claude > Bonjour! Comment puis-je vous aider aujourd'hui?
```

---

## 🔑 Configuration de l'environnement

### Fichier `~/.ai_env`

Créé automatiquement par `install.sh`, ce fichier contient vos clés API:

```bash
# Anthropic Claude API
export ANTHROPIC_API_KEY="sk-ant-your-key-here"

# OpenAI API
export OPENAI_API_KEY="sk-your-key-here"

# Google Gemini API
export GEMINI_API_KEY="your-gemini-key-here"
export GOOGLE_API_KEY="your-google-key-here"

# Répertoires
export MCP_DIR="/opt/mcp"
export DATA_DIR="/data"
```

**Charger l'environnement:**
```bash
source ~/.ai_env
```

**Ajouter au `.bashrc` pour chargement automatique:**
```bash
echo "source ~/.ai_env" >> ~/.bashrc
```

---

## 🛠️ Workflows recommandés

### Workflow 1: Installation initiale
```bash
# 1. Installer les outils
bash /opt/mcp/install.sh

# 2. Configurer les clés API
nano ~/.ai_env

# 3. Charger l'environnement
source ~/.ai_env

# 4. Tester
claude-test
ollama list
```

### Workflow 2: Développement avec surveillance
```bash
# Terminal 1: Lancer le watcher
bash /opt/mcp/watcher.sh

# Terminal 2: Travailler sur vos fichiers
cd /data/mon-projet
# Le watcher détectera automatiquement les changements
```

### Workflow 3: Session IA interactive
```bash
# Lancer un agent
bash /opt/mcp/start-agent.sh
# Sélectionner Claude CLI (1)
# Discuter avec Claude en mode interactif
```

---

## 📂 Structure des répertoires

```
/opt/mcp/          # Scripts MCP (ce répertoire)
├── install.sh     # Installation outils IA
├── watcher.sh     # Surveillance fichiers
├── start.sh       # Démarrage services
├── start-agent.sh # Lanceur agents IA
└── README_mcp.md  # Cette documentation

/data/             # Volume persistant pour vos données
└── (vos projets, fichiers, etc.)

/home/ia/          # Home de l'utilisateur IA
├── .ai_env        # Variables d'environnement
├── .bashrc        # Configuration bash
├── .local/bin/    # Scripts personnels
│   ├── claude-test
│   └── gemini-cli
├── Bureau/        # Desktop XFCE
├── Documents/     # Documents
└── Téléchargements/
```

---

## 🔌 Intégration avec les agents IA

### Utilisation de Claude depuis Python

```python
import os
from anthropic import Anthropic

# L'API key est déjà dans l'environnement
client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=2048,
    messages=[{
        "role": "user",
        "content": "Analyse le contenu de /data/projet/fichier.py"
    }]
)

print(message.content[0].text)
```

### Utilisation d'Ollama depuis Python

```python
import subprocess
import json

def query_ollama(prompt, model="llama2"):
    result = subprocess.run(
        ["ollama", "run", model, prompt],
        capture_output=True,
        text=True
    )
    return result.stdout

response = query_ollama("Résume ce texte: ...")
print(response)
```

### Utilisation de Gemini depuis Python

```python
import os
import google.generativeai as genai

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel('gemini-pro')

response = model.generate_content("Explique le MCP")
print(response.text)
```

---

## 🚀 Extensions et personnalisations

### Ajouter un nouveau script MCP

```bash
# Créer votre script
nano /opt/mcp/mon-script.sh

# Le rendre exécutable
chmod +x /opt/mcp/mon-script.sh

# L'appeler depuis d'autres scripts
bash /opt/mcp/mon-script.sh
```

### Ajouter une action au watcher

Modifier `watcher.sh` dans la fonction `handle_file_event()`:

```bash
case "$event" in
    CREATE|CLOSE_WRITE)
        if [[ "$file" == *.md ]]; then
            # Action pour fichiers Markdown
            echo "Fichier Markdown détecté: $file"
            # Exemple: Convertir en PDF
            # pandoc "$file" -o "${file%.md}.pdf"
        fi
        ;;
esac
```

### Créer un service systemd (optionnel)

```bash
# Créer le fichier service
sudo nano /etc/systemd/system/mcp-watcher.service
```

Contenu:
```ini
[Unit]
Description=MCP File Watcher
After=network.target

[Service]
Type=simple
User=ia
WorkingDirectory=/opt/mcp
ExecStart=/bin/bash /opt/mcp/watcher.sh
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Activer:
```bash
sudo systemctl enable mcp-watcher.service
sudo systemctl start mcp-watcher.service
```

---

## 📝 Logs et debugging

### Localisation des logs

- **Watcher**: `/tmp/mcp_watcher.log`
- **Ollama**: `/tmp/ollama.log`
- **Logs système**: `journalctl -u service-name`

### Consulter les logs

```bash
# Logs du watcher en temps réel
tail -f /tmp/mcp_watcher.log

# Logs d'Ollama
tail -f /tmp/ollama.log

# Tous les processus de l'utilisateur ia
ps aux | grep ia
```

---

## 🎓 Ressources supplémentaires

### Documentation officielle

- **Anthropic Claude**: https://docs.anthropic.com/
- **Ollama**: https://ollama.com/
- **Google Gemini**: https://ai.google.dev/
- **Model Context Protocol (MCP)**: https://modelcontextprotocol.io/

### Outils CLI

```bash
# Vérifier les installations
which claude
which ollama
which python3

# Versions
ollama --version
python3 --version

# Liste des modèles Ollama
ollama list

# Pull d'un nouveau modèle
ollama pull mistral
ollama pull codellama
```

---

## ✨ Conclusion

Le répertoire `/opt/mcp/` est le **centre de contrôle** de votre environnement IA. Tous les scripts sont conçus pour être **modulaires, extensibles et personnalisables**.

N'hésitez pas à:
- Modifier les scripts selon vos besoins
- Ajouter vos propres scripts
- Créer des workflows automatisés
- Intégrer de nouveaux outils IA

**Pour toute question, consultez le README principal du projet.**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 **Happy coding with AI!**
