# 🤖 Skynet File Tagger v1.0

**Système d'exploration et de tagging automatique de fichiers pour l'écosystème Skynet**

---

## 📋 Description

Skynet File Tagger est un module d'analyse intelligente de fichiers qui scanne récursivement des dossiers, analyse le contenu des fichiers texte et binaires, et attribue des tags pertinents pour faciliter la recherche, l'indexation et l'intégration avec les systèmes RAG (Retrieval-Augmented Generation).

## ✨ Fonctionnalités

- **Scan récursif** de dossiers avec filtrage automatique (fichiers > 10MB ignorés)
- **Analyse intelligente** du contenu texte:
  - Détection de mots-clés fréquents
  - Identification de topics (IA, système, log, code, réflexion...)
  - Détection d'urgence (high, medium, low)
  - Reconnaissance d'agents mentionnés (Gemini, Claude, SAF, Reflector...)
  - Extraction de dates
  - Tonalité (technique, journal, configuration...)
- **Tagging binaire** basé sur extensions (images, audio, PDF, archives...)
- **Génération de rapports** en JSON et Markdown
- **Statistiques détaillées** sur les fichiers analysés

## 📁 Structure du Projet

```
file_tagger_ai/
├── scripts/
│   ├── file_scanner.py    # Module de scan récursif
│   ├── tagger.py           # Moteur de tagging intelligent
│   └── main.py             # Script principal d'orchestration
│
├── scans/                  # Dossier contenant les fichiers à scanner
│   ├── journal_agent_2025-11-18.txt
│   ├── rapport_urgent_memoire.txt
│   ├── config_agents.txt
│   ├── note_reflexion_ia.txt
│   └── system_log_errors.txt
│
├── outputs/                # Résultats de l'analyse
│   ├── tags_output.json    # Tags au format JSON
│   └── report.md           # Rapport détaillé en Markdown
│
└── README.md               # Documentation
```

## 🚀 Utilisation

### Exécution Rapide

```bash
cd file_tagger_ai/scripts
python3 main.py
```

Le système va:
1. Scanner le dossier `scans/`
2. Analyser et tagger tous les fichiers
3. Générer `outputs/tags_output.json`
4. Générer `outputs/report.md`

### Utilisation des Modules Individuels

**Scanner seulement:**

```bash
python3 scripts/file_scanner.py /chemin/vers/dossier
```

**Tagger seulement:**

```bash
python3 scripts/tagger.py
```

## 📊 Format des Tags

### Fichiers Texte

```json
{
  "type": "text",
  "content_type": "journal",
  "urgency": "high",
  "topics": ["ia", "system", "rag"],
  "agents": ["gemini", "saf"],
  "keywords": ["système", "agents", "mémoire"],
  "detected_dates": ["2025-11-18"],
  "has_technical_content": true
}
```

### Fichiers Binaires

```json
{
  "type": "image",
  "content_type": "binary",
  "mime_type": "image/png",
  "urgency": "low",
  "topics": ["binary"],
  "agents": ["none"]
}
```

## 🔍 Topics Détectés

Le système peut identifier automatiquement:

- **ia** - Intelligence Artificielle, ML, embeddings
- **system** - Système, architecture, infrastructure
- **log** - Logs, erreurs, warnings, debug
- **code** - Code, fonctions, modules
- **config** - Configuration, paramètres
- **rapport** - Rapports, analyses
- **journal** - Journaux, notes, observations
- **memoire** - Mémoire, storage, cache
- **rag** - RAG, retrieval, vectorstore
- **reflexion** - Réflexion, pensée, analyse

## ⚡ Niveaux d'Urgence

- **🔴 High** - Fichiers critiques/urgents nécessitant une action immédiate
- **🟡 Medium** - Fichiers importants à traiter prochainement
- **🟢 Low** - Fichiers standard sans urgence particulière

## 🎯 Cas d'Usage

1. **Indexation RAG** - Préparer des fichiers pour l'ingestion dans un système RAG
2. **Organisation** - Catégoriser automatiquement de grandes collections de fichiers
3. **Détection d'urgence** - Identifier rapidement les fichiers critiques
4. **Analyse de patterns** - Découvrir les thèmes récurrents dans une base documentaire
5. **Coordination multi-agents** - Identifier quels agents sont mentionnés dans quels documents

## 🛠️ Technologies

- **Python 3** (stdlib uniquement, aucune dépendance externe)
- Modules utilisés: `os`, `pathlib`, `mimetypes`, `json`, `re`, `collections`, `datetime`

## 📦 Installation

Aucune installation requise! Le système utilise uniquement la bibliothèque standard Python.

Prérequis:
- Python 3.7+

## 🔧 Configuration

Vous pouvez modifier les constantes dans `tagger.py`:

- `MAX_FILE_SIZE` - Taille maximale des fichiers (par défaut 10MB)
- `TEXT_EXTENSIONS` - Extensions considérées comme texte
- Dictionnaires de mots-clés pour la détection

## 📝 Exemple de Rapport

Le système génère un rapport Markdown complet avec:

- Statistiques générales (nombre de fichiers, taille totale)
- Distribution des extensions
- Topics identifiés avec occurrences
- Agents détectés
- Niveaux d'urgence
- Fichiers urgents
- Exemples de fichiers taggés
- Patterns identifiés (dates, contenu technique)

Voir `outputs/report.md` pour un exemple complet.

## 🌟 Intégration avec Skynet

Ce module s'intègre parfaitement avec:

- **Gemini** - Analyse de contenu via API
- **SAF (System Agent Framework)** - Coordination des agents
- **Reflector** - Auto-évaluation et réflexion
- **RAG Systems** - Préparation de données pour embeddings

## 🚧 Développement Futur

- [ ] Support de plus de formats de fichiers (PDF, DOCX)
- [ ] Analyse sémantique avancée avec embeddings
- [ ] Interface CLI interactive
- [ ] API REST pour intégration web
- [ ] Cache de tags pour performances
- [ ] Support multi-langue

## 📄 Licence

Module développé pour l'écosystème Skynet.

---

**Version**: 1.0
**Date**: 2025-11-18
**Auteur**: Skynet AI System

*Généré automatiquement par Claude Code 4.5*
