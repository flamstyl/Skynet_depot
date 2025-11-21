# 📋 Contexte — Agent Claude

## 🌍 Environnement Actuel

**Date** : 2025-11-21
**Projet** : MCP Obsidian Core — Markdown Cognitive Process
**Statut** : Initialisation
**Phase** : Déploiement infrastructure

---

## 🎯 Mission Actuelle

### Objectif Principal

Mettre en place et opérationnaliser l'infrastructure **MCP Obsidian Core**, un système permettant à plusieurs agents IA d'utiliser des dossiers Markdown comme mémoire vivante et interface de commande.

### Sous-Objectifs

1. ✅ Créer la structure de dossiers complète
2. ✅ Générer les fichiers de configuration
3. ⏳ Implémenter le système de surveillance (watcher)
4. ⏳ Développer le dispatcher
5. ⏳ Mettre en place le système RAG
6. ⏳ Configurer l'intégration n8n

---

## 📁 Structure du Projet

```
/MCP/
├── Claude/           ← Ton espace de travail
│   ├── directives.md ← Tes règles permanentes
│   ├── context.md    ← Ce fichier
│   ├── tasks.md      ← Tes tâches
│   ├── memory/       ← Tes logs et journaux
│   ├── rag/          ← Ta base de connaissances
│   ├── output/       ← Tes productions
│   └── sync/         ← Synchronisation externe
├── Gemini/           ← Agent Gemini
├── GPT/              ← Agent GPT
└── core/             ← Infrastructure partagée
    ├── watcher/      ← Surveillance temps réel
    └── n8n_connector/ ← Automatisation
```

---

## 🔧 Technologies Utilisées

### Infrastructure

- **Langage** : Python 3.9+
- **Surveillance** : watchdog
- **Format** : Markdown (.md)
- **Automatisation** : n8n
- **Versioning** : Git

### Stack Technique

- **Watcher** : Python + watchdog
- **Dispatcher** : Python + asyncio
- **RAG** : Python + JSON indexing
- **n8n** : Node.js + webhooks
- **Storage** : File system + Google Drive

---

## 👥 Autres Agents

### Agent Gemini

- **Rôle** : Analyse de données et visualisation
- **Spécialité** : Data science, ML, analytics
- **Statut** : Inactif (en attente de configuration)

### Agent GPT

- **Rôle** : Génération de contenu et NLP
- **Spécialité** : Rédaction, traduction, dialogue
- **Statut** : Inactif (en attente de configuration)

---

## 🗺️ État du Déploiement

### Phase 1 : Infrastructure ✅

- [x] Structure de dossiers créée
- [x] README.md documentation
- [x] Fichiers de configuration initiaux

### Phase 2 : Core Systems ⏳

- [ ] Watcher opérationnel
- [ ] Dispatcher fonctionnel
- [ ] RAG system actif
- [ ] n8n intégré

### Phase 3 : Opérationnalisation 🔜

- [ ] Tests end-to-end
- [ ] Documentation complète
- [ ] Formation des agents
- [ ] Monitoring et alerting

---

## 🎯 Priorités Actuelles

### Priorité 1 (Critique)

1. Finaliser le watcher.py avec watchdog
2. Implémenter le dispatcher.py
3. Créer le système RAG basique

### Priorité 2 (Importante)

1. Configurer n8n pour la synchronisation
2. Créer les templates de journaux
3. Tester le cycle complet

### Priorité 3 (Souhaitable)

1. Optimiser les performances
2. Ajouter des tests unitaires
3. Créer une interface web

---

## 📊 Métriques de Succès

### Critères d'Acceptation

- ✅ Structure de dossiers complète
- ⏳ Watcher détecte les modifications en < 1s
- ⏳ Dispatcher traite les événements en < 2s
- ⏳ RAG retrouve les informations pertinentes
- ⏳ Synchronisation n8n fonctionne toutes les heures

### KPIs

- **Temps de réponse** : < 2s
- **Disponibilité** : > 99%
- **Précision RAG** : > 90%
- **Couverture tests** : > 80%

---

## 🔗 Dépendances

### Dépendances Système

```
Python 3.9+
pip
git
```

### Dépendances Python

```
watchdog>=3.0.0
asyncio
json
datetime
pathlib
```

### Dépendances Optionnelles

```
Node.js 18+ (pour n8n)
Docker (pour containerisation)
```

---

## 🚧 Contraintes et Limitations

### Techniques

- File system comme backend (pas de DB pour MVP)
- Recherche RAG simple (pas d'embeddings avancés)
- Synchronisation unidirectionnelle initialement

### Opérationnelles

- Pas de monitoring avancé (MVP)
- Logs basiques
- Pas de haute disponibilité (single instance)

---

## 📚 Références Importantes

### Documentation

- [README Principal](/MCP/core/README.md)
- [Directives Claude](/MCP/Claude/directives.md)
- [Tasks en cours](/MCP/Claude/tasks.md)

### Ressources Externes

- Watchdog : https://pypi.org/project/watchdog/
- n8n : https://n8n.io/
- Markdown : https://commonmark.org/

---

## 🔄 Dernières Actions

### 2025-11-21 14:30

- ✅ Création de la structure de dossiers
- ✅ Génération du README.md principal
- ✅ Création des directives.md pour tous les agents
- ✅ Initialisation du context.md

### Prochaines Actions

- ⏳ Implémenter watcher.py
- ⏳ Créer dispatcher.py
- ⏳ Développer le système RAG

---

## 🎨 Cas d'Usage

### Scénario 1 : Traitement de Tâche

```markdown
1. Utilisateur ajoute dans tasks.md :
   - [ ] Créer un script de backup

2. Watcher détecte la modification

3. Dispatcher charge directives + context

4. Agent Claude traite la tâche

5. Mise à jour :
   - [x] Créer un script de backup — Fait le 2025-11-21 15:00

6. Sortie dans output/backup_script.sh

7. Log dans memory/journal_2025-11-21.md
```

### Scénario 2 : Mise à Jour Context

```markdown
1. Context.md est modifié (nouveau projet)

2. Watcher détecte

3. Dispatcher recharge le context

4. Agent Claude adapte son comportement

5. Log de la mise à jour
```

---

## 🔐 Informations Sensibles

> ⚠️ Ne jamais stocker de secrets ici
> Utiliser des variables d'environnement
> Chiffrer les données sensibles dans sync/

---

## 📝 Notes de Travail

### Observations

- La structure Markdown est flexible et lisible
- Le watcher doit être robuste (gestion d'erreurs)
- Le RAG peut être amélioré avec des embeddings futurs

### Idées d'Amélioration

- Ajouter un cache pour le RAG
- Interface web type Obsidian
- Multi-threading pour le dispatcher
- Compression des anciens logs

---

**Dernière mise à jour** : 2025-11-21 14:30
**Mise à jour par** : Claude
**Version** : 1.0.0
**Statut** : Actif
