# 🔑 Configuration API Keys - Grok CLI

## Étapes Rapides

### 1. Copier le fichier .env
```bash
cd C:\Users\rapha\IA\Skynet_depot\grok_cli
# Le fichier .env existe déjà, il faut juste ajouter ta clé
```

### 2. Éditer `.env` et ajouter ta clé API

Ouvre `C:\Users\rapha\IA\Skynet_depot\grok_cli\.env` et remplace :

**Pour OpenAI (GPT-4):**
```env
OPENAI_API_KEY=ta-vraie-clé-openai-ici
```

**OU pour Anthropic (Claude):**
```env
ANTHROPIC_API_KEY=ta-vraie-clé-anthropic-ici
```

### 3. Vérifier le provider dans la config

Ouvre `config/default_config.yaml` et vérifie ligne 90-97 :

```yaml
llm:
  provider: openai  # ou "anthropic" pour Claude
  model: gpt-4      # ou "claude-3-opus-20240229"
  temperature: 0.3
  max_tokens: 4000
  api_key_env: OPENAI_API_KEY  # ou ANTHROPIC_API_KEY
```

### 4. Relancer la CLI

```bash
cd C:\Users\rapha\IA\Skynet_depot\grok_cli
python cli.py start
```

---

## Où trouver les clés API ?

**OpenAI (GPT-4) :**
- https://platform.openai.com/api-keys
- Format : `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Anthropic (Claude) :**
- https://console.anthropic.com/settings/keys
- Format : `sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Vérification

Une fois lancée, teste avec :
```
grok> /help
```

Si tu vois l'aide, la CLI fonctionne.

Pour tester l'IA :
```
grok> What is this project about?
```

Si tu as une erreur de clé API, vérifie :
1. ✅ Fichier `.env` existe dans `grok_cli/`
2. ✅ Clé API correcte (commence par `sk-`)
3. ✅ Variable correspond au provider dans `default_config.yaml`

---

## Changement de Provider

**Passer à Claude :**
```yaml
# config/default_config.yaml
llm:
  provider: anthropic
  model: claude-3-5-sonnet-20241022
  api_key_env: ANTHROPIC_API_KEY
```

**Passer à GPT-4 :**
```yaml
llm:
  provider: openai
  model: gpt-4
  api_key_env: OPENAI_API_KEY
```

---

## Troubleshooting

**Error: "OpenAI not installed"**
```bash
pip install openai
```

**Error: "Anthropic not installed"**
```bash
pip install anthropic
```

**Error: API key vide**
→ Vérifie que `.env` contient bien la clé (pas juste `your-key-here`)

**Error: Invalid API key**
→ Génère une nouvelle clé sur le site du provider
