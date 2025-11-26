# 🧠 Synapse Planner — Routine Quotidienne Skynet

**Version 1.0.0**

Moteur automatique de génération de planning quotidien pour Skynet.
Génère une feuille de route complète chaque jour avec tâches, surveillance, vérifications et synthèses.

---

## 📋 Description

**Synapse Planner** est le système de planification automatique au cœur de Skynet.
Chaque jour à 10h (configurable), il génère un planning structuré reprenant :

- 🟥 Tâches prioritaires
- 🟦 Surveillance à effectuer
- 🟨 Vérification des logs
- 🟩 Messages à envoyer
- 🟪 Synthèses à produire

Le système s'appuie sur :
- Configuration de tâches prédéfinies
- Logs système simulés
- Mémoire RAG et notes d'agents
- Alertes et événements importants

---

## 🏗️ Architecture

```
synapse_planner/
├── core/
│   ├── synapse_planner.py      # Moteur principal
│   └── memory_fetcher.py        # Récupération mémoire
│
├── data/
│   ├── synapse_config.json      # Configuration des tâches
│   └── logs_mock.json           # Logs simulés
│
├── outputs/
│   ├── taches_du_jour.md        # Planning généré
│   └── last_generation.txt      # Métadonnées
│
└── README.md                     # Documentation
```

---

## ⚙️ Installation

### Prérequis

- Python 3.7+
- Aucune dépendance externe requise

### Mise en place

```bash
# Cloner le dépôt
cd Skynet_depot/synapse_planner

# Le système est prêt à l'emploi, aucune installation nécessaire
```

---

## 🚀 Utilisation

### Génération manuelle d'un planning

```bash
cd synapse_planner/core
python synapse_planner.py
```

### Sortie attendue

```
🧠 Synapse Planner — Démarrage...
📅 Date: 2025-11-18 10:00:00

⚙️  Génération du planning...
✅ Planning sauvegardé: /outputs/taches_du_jour.md
✅ Métadonnées sauvegardées: /outputs/last_generation.txt

📊 24 tâches générées au total
🎯 Synapse Planner terminé avec succès!
```

### Fichiers générés

1. **`taches_du_jour.md`** : Planning quotidien complet en Markdown
2. **`last_generation.txt`** : Métadonnées de la dernière exécution

---

## 📁 Fichiers de configuration

### `synapse_config.json`

Définit les tâches à générer pour chaque catégorie :

```json
{
  "generation_time": "10:00",
  "tasks": {
    "prioritaire": ["Analyse IA", "Sync Drive", ...],
    "surveillance": ["Agents actifs", ...],
    "verification": ["Logs du dernier cycle", ...],
    "messages": ["Notifications Telegram", ...],
    "syntheses": ["Synthèse mémoire", ...]
  },
  "recurrence": {
    "prioritaire": "daily",
    ...
  }
}
```

### `logs_mock.json`

Simule les logs système pour analyse :

```json
{
  "logs": [
    {"time": "09:12", "agent": "Gemini", "message": "..."},
    ...
  ],
  "errors": [...],
  "alerts": [...],
  "statistics": {...}
}
```

---

## 🧩 Modules

### `synapse_planner.py`

**Moteur principal** qui :
- Charge la configuration
- Récupère les logs et la mémoire
- Génère le planning en Markdown
- Sauvegarde les fichiers

**Classe principale :**

```python
from synapse_planner import SynapsePlanner

planner = SynapsePlanner()
result = planner.run()
```

### `memory_fetcher.py`

**Module de récupération mémoire** qui simule :
- `fetch_recent_memory()` : Notes mémoire récentes
- `fetch_agent_notes()` : Notes des agents actifs
- `fetch_alerts()` : Alertes importantes
- `fetch_recommendations()` : Recommandations
- `get_memory_summary()` : Résumé complet

**Exemple d'utilisation :**

```python
from memory_fetcher import get_memory_summary

memory = get_memory_summary()
print(memory["recent_memory"])
```

---

## 📊 Format du planning généré

Le fichier `taches_du_jour.md` suit cette structure :

```markdown
# 🧠 Tâches du jour — 2025-11-18

## 🟥 Tâches prioritaires
- [ ] Analyse IA - Vérifier les nouveaux modèles
- [ ] Sync Drive - Synchronisation des dossiers critiques
...

## 🟦 Surveillance à effectuer
- [ ] Agents actifs - Statut et santé système
...

## 📘 Notes mémoire récentes
- Gemini a indexé 12 nouveaux articles...
...

## 🤖 Notes des agents
- **[09:12] Gemini**: Nettoyage terminé...
...

## 🧩 Événements importants détectés
- 🔴 Nouvelle vulnérabilité détectée
...

## 📊 Résumé des logs système
- **Tâches totales**: 11
- **Succès**: 10
...

## 💡 Recommandations
- Planifier une révision des dossiers critiques
...
```

---

## 🔄 Automatisation (Futur)

### Avec Cron (Linux/macOS)

```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne pour exécution quotidienne à 10h
0 10 * * * cd /path/to/synapse_planner/core && python synapse_planner.py
```

### Avec Task Scheduler (Windows)

1. Ouvrir le Planificateur de tâches
2. Créer une tâche de base
3. Déclencheur : Quotidien à 10:00
4. Action : Lancer `python synapse_planner.py`

---

## 🛠️ Personnalisation

### Modifier les tâches

Éditez `data/synapse_config.json` et ajoutez vos propres tâches :

```json
{
  "tasks": {
    "prioritaire": [
      "Votre nouvelle tâche prioritaire"
    ]
  }
}
```

### Changer l'heure de génération

Modifiez le champ `generation_time` :

```json
{
  "generation_time": "08:00"
}
```

### Ajouter de nouveaux agents

Éditez le tableau `agents_monitored` :

```json
{
  "agents_monitored": [
    "Gemini",
    "Echo",
    "VotreNouvelAgent"
  ]
}
```

---

## 🧪 Tests

### Tester le module memory_fetcher

```bash
cd synapse_planner/core
python memory_fetcher.py
```

### Tester le planner complet

```bash
cd synapse_planner/core
python synapse_planner.py
```

---

## 📈 Évolutions futures

### Version 2.0 (Planifiée)

- 🔄 **Planning adaptatif** : Ajustement basé sur l'historique
- 🌐 **Web Dashboard** : Interface web pour visualisation
- 🤖 **Intégration IA** : Génération intelligente de tâches
- 📊 **Analytics** : Statistiques et métriques avancées
- 🔔 **Notifications** : Telegram, Email, Slack
- 💾 **Persistance** : Base de données pour historique

### Fonctionnalités avancées

- Priorisation dynamique
- Détection d'anomalies
- Suggestions de tâches basées sur patterns
- Intégration avec autres agents Skynet

---

## 🤝 Contribution

Le Synapse Planner est un module central de Skynet.
Pour toute amélioration ou suggestion :

1. Testez vos modifications localement
2. Documentez les changements
3. Assurez-vous de la compatibilité

---

## 📝 Licence

Projet interne Skynet — Tous droits réservés

---

## 👨‍💻 Auteur

Développé par **Claude Code 4.5** pour le système Skynet
Orchestré par **Raphaël**

---

## 🔗 Liens utiles

- [Documentation Skynet](../docs/)
- [Agents Skynet](../agents/)
- [Configuration globale](../config/)

---

## 📞 Support

Pour toute question ou problème :
- Consultez les logs dans `outputs/last_generation.txt`
- Vérifiez la configuration dans `data/synapse_config.json`
- Testez les modules individuellement

---

**🧠 Synapse Planner — Le cerveau organisationnel de Skynet**

*Version 1.0.0 — Novembre 2025*
