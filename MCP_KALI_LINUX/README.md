# 🟣 MCP Kali Linux

## Environnement Kali Linux Dockerisé pour IA de Cybersécurité

[![Docker](https://img.shields.io/badge/Docker-Required-blue.svg)](https://www.docker.com/)
[![Kali Linux](https://img.shields.io/badge/Kali-Rolling-557C94.svg)](https://www.kali.org/)
[![License](https://img.shields.io/badge/License-Educational-green.svg)](LICENSE)

---

## 🎯 Concept

**MCP_KALI_LINUX** est un environnement Kali Linux entièrement conteneurisé, conçu spécifiquement pour être piloté par des Intelligence Artificielles (Claude CLI, ChatGPT CLI, Gemini CLI, etc.) dans le cadre de :

- 🔐 **Tests de sécurité autorisés** (pentesting)
- 🏆 **Challenges CTF** (Capture The Flag)
- 🧪 **Laboratoire d'apprentissage** en cybersécurité
- 🔬 **Recherche en sécurité offensive** et défensive
- 🤖 **Bac à sable isolé** pour expérimentations IA

### Pourquoi ce projet ?

Les IA modernes peuvent désormais orchestrer des outils de sécurité complexes, mais elles ont besoin d'un environnement :
- ✅ **Isolé** : réseau bridge dédié, pas d'impact sur l'hôte
- ✅ **Contrôlé** : droits admin à l'intérieur, sécurisé à l'extérieur
- ✅ **Complet** : tous les outils nécessaires préinstallés
- ✅ **Pilotable** : interface MCP pour orchestration automatique
- ✅ **Éthique** : cadre strict d'utilisation légale

---

## ⚙️ Prérequis

### Système hôte

- **Docker Engine** 20.10+
- **Docker Compose** 2.0+
- **4 GB RAM** minimum (8 GB recommandé)
- **20 GB d'espace disque** disponible
- **Connexion Internet** (pour build et scans externes)

### Vérification rapide

```bash
docker --version
docker compose version
```

---

## 🏗️ Installation et Build

### 1. Cloner le repository

```bash
git clone <votre-repo>/MCP_KALI_LINUX.git
cd MCP_KALI_LINUX
```

### 2. Build de l'image Docker

```bash
docker compose build
```

⏱️ **Temps estimé:** 10-20 minutes (selon votre connexion)

L'image résultante fait environ **3-4 GB** et contient :
- Kali Linux Rolling (base)
- 50+ outils de sécurité préinstallés
- Terminal web (ttyd)
- Scripts MCP d'orchestration

---

## 🚀 Lancement

### Démarrage de l'environnement

```bash
docker compose up -d
```

### Vérification du statut

```bash
docker compose ps
docker compose logs -f kali_mcp
```

Vous devriez voir :

```
🟣 MCP KALI LINUX - AI Security Lab 🟣
[INFO] Environnement MCP Kali prêt ! 🟣
[INFO] Accès terminal web: http://localhost:7681
```

---

## 🧩 Modes d'Accès

### Option 1: Shell Interactif (Recommandé pour IA CLI)

```bash
docker exec -it mcp_kali bash
```

Vous êtes maintenant connecté en tant qu'utilisateur `ia` avec droits sudo.

```bash
ia@kali-mcp:~$ whoami
ia
ia@kali-mcp:~$ sudo -l
User ia may run the following commands on kali-mcp:
    (ALL) NOPASSWD: ALL
```

### Option 2: Terminal Web (Interface Navigateur)

Ouvrez votre navigateur à l'adresse :

```
http://localhost:7681
```

Interface web interactive pour piloter le conteneur depuis le navigateur.

### Option 3: SSH (Optionnel, désactivé par défaut)

Pour activer SSH, modifiez `docker-compose.yml` :

```yaml
environment:
  - SSH_ENABLED=true
ports:
  - "127.0.0.1:2222:22"
```

Puis redémarrez :

```bash
docker compose down && docker compose up -d
ssh -p 2222 ia@localhost
```

---

## 🤖 Intégration IA - Mode d'Emploi

### Concept MCP (Mission Control Protocol)

L'environnement intègre un **agent MCP** qui surveille en permanence le fichier `ai_context/mission.json`. Dès qu'une mission est déposée, l'agent :

1. ✅ Parse la mission JSON
2. ✅ Exécute les scans appropriés (nmap, nikto, etc.)
3. ✅ Collecte et structure les logs
4. ✅ Génère un rapport Markdown
5. ✅ Prépare un résumé pour analyse IA

### Workflow IA typique

#### Étape 1 : Créer une mission

Éditez `ai_context/mission.json` avec votre cible et vos objectifs :

```json
{
  "target": "scanme.nmap.org",
  "objectives": [
    "Scanner les ports ouverts",
    "Identifier les services vulnérables",
    "Générer un rapport de synthèse"
  ],
  "constraints": [
    "Ne pas lancer d'attaque destructive",
    "Utilisation uniquement d'outils de reconnaissance"
  ]
}
```

#### Étape 2 : L'agent MCP détecte et exécute

L'agent détecte automatiquement la nouvelle mission et lance les scans appropriés.

Vous pouvez suivre la progression :

```bash
docker compose logs -f kali_mcp
tail -f logs/mcp_agent.log
```

#### Étape 3 : Récupérer les résultats

Une fois terminé, plusieurs fichiers sont générés :

```
logs/results/mission_YYYYMMDD_HHMMSS/
├── report.md                    # Rapport de la mission
├── nmap_*.txt                   # Résultats bruts Nmap
├── nikto_*.txt                  # Résultats Nikto
└── ...

ai_context/
├── summary_for_ai.md           # Résumé structuré pour IA
├── status.json                 # Statut de l'agent
└── mission_*_completed.json    # Mission archivée
```

#### Étape 4 : Analyse IA

L'IA (Claude, GPT, etc.) peut maintenant :

1. Lire `ai_context/summary_for_ai.md`
2. Analyser les vulnérabilités détectées
3. Générer des recommandations
4. Compléter le `report_template.md`

### Exemple avec Claude Code CLI

```bash
# Se connecter au conteneur
docker exec -it mcp_kali bash

# Lancer Claude Code à l'intérieur
claude-code

# Dans Claude Code :
# "Lis le fichier /ai_context/summary_for_ai.md et analyse les vulnérabilités"
# "Génère un rapport exécutif avec recommandations prioritaires"
# "Complète le template dans /ai_context/report_template.md"
```

---

## 🛠️ Outils Disponibles

### Reconnaissance

| Outil | Description |
|-------|-------------|
| `nmap` | Scanner de ports réseau (version, OS, scripts NSE) |
| `masscan` | Scanner ultra-rapide de ports |
| `rustscan` | Scanner moderne en Rust |
| `subfinder` | Énumération de sous-domaines |
| `httpx` | Probe HTTP/HTTPS |
| `nuclei` | Scanner de vulnérabilités basé sur templates |

### Exploitation Web

| Outil | Description |
|-------|-------------|
| `nikto` | Scanner de vulnérabilités web |
| `sqlmap` | Exploitation SQL Injection automatisée |
| `gobuster` | Directory/DNS busting |
| `wfuzz` | Web fuzzing |
| `ffuf` | Fast web fuzzer |
| `wpscan` | Scanner WordPress |

### Brute Force & Cracking

| Outil | Description |
|-------|-------------|
| `hydra` | Brute force parallèle (SSH, FTP, HTTP, etc.) |
| `medusa` | Brute force modulaire |
| `john` | John the Ripper (cracking de mots de passe) |
| `hashcat` | GPU password cracker |
| `crunch` | Générateur de wordlists |

### Réseau & Capture

| Outil | Description |
|-------|-------------|
| `tcpdump` | Capture de paquets réseau |
| `tshark` | Wireshark en CLI |
| `ettercap` | Man-in-the-Middle |
| `hping3` | Packet crafting |
| `ngrep` | Grep pour paquets réseau |

### Analyse & Forensics

| Outil | Description |
|-------|-------------|
| `binwalk` | Analyse de firmware |
| `foremost` | Récupération de fichiers |
| `exiftool` | Extraction de métadonnées |
| `strings` | Extraction de chaînes de caractères |

### Développement

| Outil | Description |
|-------|-------------|
| `python3` | Python 3 + pip |
| `golang` | Go compiler |
| `nodejs` | Node.js + npm |
| `git` | Version control |

---

## 📁 Structure du Projet

```
MCP_KALI_LINUX/
├── Dockerfile                   # Image Kali personnalisée
├── docker-compose.yml           # Orchestration et configuration
├── README.md                    # Ce fichier
│
├── scripts/                     # Scripts d'orchestration MCP
│   ├── startup.sh              # Point d'entrée du conteneur
│   ├── mcp_agent.sh            # Agent de surveillance et exécution
│   └── analyze_logs.sh         # Analyse et structuration des logs
│
├── logs/                        # Logs et résultats de sessions
│   ├── startup.log             # Logs de démarrage
│   ├── mcp_agent.log           # Logs de l'agent
│   └── results/                # Résultats des scans (persistants)
│       └── mission_*/          # Un dossier par mission
│
└── ai_context/                  # Interface IA
    ├── mission.json            # Mission en cours (créé par IA)
    ├── status.json             # Statut de l'agent
    ├── summary_for_ai.md       # Résumé pour analyse IA
    └── report_template.md      # Template de rapport
```

---

## 🔐 Sécurité et Isolation

### Mesures de Sécurité Implémentées

✅ **Réseau isolé**
- Bridge Docker dédié (`172.28.0.0/16`)
- Pas de connexion directe aux autres conteneurs

✅ **Ports sur localhost uniquement**
- Tous les ports exposés sur `127.0.0.1` (pas `0.0.0.0`)
- Pas d'accès depuis Internet

✅ **Capabilities limitées**
- Uniquement `NET_ADMIN` et `NET_RAW` (pour capture de paquets)
- Pas de mode `privileged` par défaut

✅ **Pas d'accès root SSH**
- SSH désactivé par défaut
- Si activé, root login interdit

✅ **Volumes persistants contrôlés**
- Uniquement logs et contexte IA montés
- Pas d'accès direct au filesystem hôte

### ⚠️ Avertissements de Sécurité

**À NE JAMAIS FAIRE :**

❌ Exposer les ports sur `0.0.0.0` en production
❌ Activer `privileged: true` sans raison valable
❌ Lancer sur un serveur public sans VPN/Firewall
❌ Scanner des cibles non autorisées
❌ Utiliser en production (environnement de test uniquement)

**Configuration actuelle = Usage LOCAL uniquement**

---

## ⚖️ Cadre Légal et Éthique

### 🚨 CLAUSE IMPORTANTE

**Cet environnement contient des outils offensifs puissants.**

Son utilisation est strictement limitée à :

✅ **Tests de sécurité AUTORISÉS**
- Avec accord écrit du propriétaire
- Sur infrastructure dédiée aux tests
- Dans le cadre d'un contrat de pentest

✅ **CTF et Challenges**
- Plateformes dédiées (HackTheBox, TryHackMe, etc.)
- Environnements de lab isolés

✅ **Formation et Recherche**
- Apprentissage personnel sur VMs locales
- Recherche académique en sécurité

❌ **STRICTEMENT INTERDIT**
- Scanner des cibles sans autorisation
- Tests sur infrastructure de production non autorisés
- Activités malveillantes de quelque nature que ce soit

### Responsabilité

**L'utilisateur est seul responsable** de l'usage qu'il fait de cet environnement.
Les développeurs de ce projet déclinent toute responsabilité en cas d'usage illégal ou non autorisé.

**Respectez les lois locales** sur la cybersécurité et le Computer Fraud and Abuse Act (CFAA) ou équivalents.

---

## 🧠 Usage Typique - Scénarios

### Scénario 1 : Reconnaissance d'une Cible Autorisée

```bash
# 1. Entrer dans le conteneur
docker exec -it mcp_kali bash

# 2. Scanner une cible (exemple : scanme.nmap.org)
nmap -sV -sC scanme.nmap.org -oN ~/scan_results.txt

# 3. Analyser les résultats
cat ~/scan_results.txt
```

### Scénario 2 : Scan Web Automatisé

```bash
# Scanner un site web pour vulnérabilités
nikto -h http://testphp.vulnweb.com -output ~/nikto_results.txt

# Fuzzing de directories
gobuster dir -u http://testphp.vulnweb.com -w /usr/share/wordlists/dirb/common.txt
```

### Scénario 3 : Mode MCP Automatique (Piloté par IA)

1. Créer une mission dans `ai_context/mission.json`
2. L'agent MCP détecte et exécute automatiquement
3. Récupérer le rapport dans `logs/results/mission_*/report.md`
4. L'IA analyse `ai_context/summary_for_ai.md`
5. Génération de recommandations

---

## 🧪 Tests et Validation

### Vérifier que l'environnement fonctionne

```bash
# Test 1 : Conteneur actif
docker compose ps

# Test 2 : Outils disponibles
docker exec -it mcp_kali nmap --version
docker exec -it mcp_kali nikto -Version

# Test 3 : Connectivité réseau
docker exec -it mcp_kali ping -c 3 8.8.8.8

# Test 4 : Terminal web
curl http://localhost:7681

# Test 5 : Agent MCP
docker exec -it mcp_kali cat /ai_context/status.json
```

### Scan de Test

Utilisez une cible légale publique pour tester :

```bash
docker exec -it mcp_kali nmap -sV scanme.nmap.org
```

**Note:** `scanme.nmap.org` est fourni par Nmap spécifiquement pour tester les scanners.

---

## 🔧 Dépannage

### Problème : Le conteneur ne démarre pas

```bash
# Vérifier les logs
docker compose logs kali_mcp

# Reconstruire l'image
docker compose build --no-cache
docker compose up -d
```

### Problème : Pas d'accès Internet dans le conteneur

```bash
# Tester DNS
docker exec -it mcp_kali ping google.com

# Vérifier la configuration réseau
docker network inspect mcp_kali_linux_kali_net
```

### Problème : ttyd ne répond pas

```bash
# Vérifier que ttyd tourne
docker exec -it mcp_kali ps aux | grep ttyd

# Redémarrer le conteneur
docker compose restart kali_mcp
```

### Problème : Espace disque insuffisant

```bash
# Nettoyer les images Docker inutilisées
docker system prune -a

# Vérifier l'espace utilisé
docker system df
```

---

## 📚 Ressources et Documentation

### Documentation Officielle

- [Kali Linux Documentation](https://www.kali.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Nmap Reference Guide](https://nmap.org/book/man.html)

### Apprentissage

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [HackTheBox](https://www.hackthebox.com/)
- [TryHackMe](https://tryhackme.com/)
- [PentesterLab](https://pentesterlab.com/)

### Cibles de Test Légales

- `scanme.nmap.org` - Scanner de test Nmap
- `testphp.vulnweb.com` - Application web vulnérable
- `testhtml5.vulnweb.com` - Application HTML5 test
- `testasp.vulnweb.com` - Application ASP test

---

## 🎯 TODO / Évolutions Futures

### Fonctionnalités Prévues

- [ ] **Intégration OpenAI/Claude API**
  - Service qui lit les logs et interroge directement les modèles
  - Génération automatique de rapports via API

- [ ] **Module RAG (Retrieval Augmented Generation)**
  - Base de connaissances locale sur les vulnérabilités
  - Recherche sémantique dans les CVE et exploits

- [ ] **Interface Web Dashboard**
  - Visualisation temps réel des scans
  - Graphiques de vulnérabilités
  - Interface pour créer des missions

- [ ] **Scénarios CTF Préfabriqués**
  - Challenges locaux intégrés
  - Environments de lab automatisés

- [ ] **Support Multi-Agent**
  - Agent "Scanner" : reconnaissance passive
  - Agent "Analyste" : corrélation de données
  - Agent "Rédacteur" : génération de rapports

- [ ] **Intégration CI/CD**
  - Tests de sécurité automatisés dans pipeline
  - Scan de containers et images

- [ ] **Modules de Formation**
  - Tutoriels interactifs pour IA
  - Progression par difficulté

### Contributions

Les contributions sont bienvenues ! Pour proposer des améliorations :

1. Fork le repository
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 🐛 Rapporter un Bug

Si vous rencontrez un problème :

1. Vérifier que le problème n'existe pas déjà dans les Issues
2. Créer une nouvelle Issue avec :
   - Description détaillée du problème
   - Étapes pour reproduire
   - Logs pertinents
   - Configuration système (OS, Docker version, etc.)

---

## 📝 Changelog

### Version 1.0 (2025-11-22)

- ✅ Release initiale
- ✅ Image Kali Docker complète
- ✅ Agent MCP d'orchestration
- ✅ Scripts d'analyse de logs
- ✅ Template de rapport
- ✅ Documentation complète
- ✅ Isolation réseau et sécurité

---

## 👨‍💻 Auteurs

- **MCP Kali Linux** - Environnement de cybersécurité pour IA
- Développé pour Claude Code CLI et autres IA

---

## 📄 License

Ce projet est fourni à des fins éducatives et de recherche uniquement.

**Utilisation strictement dans un cadre légal et autorisé.**

---

## 🙏 Remerciements

- **Offensive Security** pour Kali Linux
- **Nmap** pour le scanner réseau
- **Docker** pour la containerisation
- **La communauté open-source** pour les outils de sécurité

---

## 💬 Support

Pour toute question ou assistance :

- 📖 Consultez d'abord la documentation ci-dessus
- 🐛 Signalez les bugs via Issues
- 💡 Proposez des améliorations via Pull Requests

---

**🟣 Bon hacking éthique avec MCP Kali Linux ! 🟣**

*"With great power comes great responsibility"* - Utilisez ces outils de manière responsable et légale.
