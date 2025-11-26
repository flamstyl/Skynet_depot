#!/usr/bin/env python3
"""
Skynet File Tagger - Script Principal
Orchestration complète: scan + tagging + génération de rapport
"""

import os
import json
from pathlib import Path
from datetime import datetime
from file_scanner import scan_directory, get_scan_statistics
from tagger import tag_all_files, save_tags_to_json


def generate_markdown_report(tagged_files, stats, output_path):
    """
    Génère un rapport Markdown détaillé.

    Args:
        tagged_files: Liste des fichiers taggés
        stats: Statistiques du scan
        output_path: Chemin du fichier de sortie
    """
    report = []

    # En-tête
    report.append("# 🤖 Skynet File Tagger - Rapport d'Analyse\n")
    report.append(f"**Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    report.append("---\n")

    # Statistiques générales
    report.append("## 📊 Statistiques Générales\n")
    report.append(f"- **Total de fichiers scannés**: {stats['total_files']}")
    report.append(f"- **Fichiers texte**: {stats['text_files']}")
    report.append(f"- **Fichiers binaires**: {stats['binary_files']}")
    report.append(f"- **Taille totale**: {stats['total_size_mb']} MB\n")

    # Extensions trouvées
    report.append("### Extensions Détectées\n")
    report.append("| Extension | Nombre de fichiers |")
    report.append("|-----------|-------------------|")
    for ext, count in sorted(stats['extensions'].items(), key=lambda x: x[1], reverse=True):
        report.append(f"| `{ext}` | {count} |")
    report.append("")

    # Analyse des tags
    report.append("## 🏷️ Analyse des Tags\n")

    # Compter les topics
    all_topics = {}
    all_agents = {}
    urgency_counts = {"high": 0, "medium": 0, "low": 0}

    for file in tagged_files:
        tags = file['tags']

        # Topics
        if 'topics' in tags:
            for topic in tags['topics']:
                all_topics[topic] = all_topics.get(topic, 0) + 1

        # Agents
        if 'agents' in tags:
            for agent in tags['agents']:
                all_agents[agent] = all_agents.get(agent, 0) + 1

        # Urgence
        if 'urgency' in tags:
            urgency_counts[tags['urgency']] = urgency_counts.get(tags['urgency'], 0) + 1

    # Topics
    report.append("### Topics Identifiés\n")
    if all_topics:
        report.append("| Topic | Occurrences |")
        report.append("|-------|-------------|")
        for topic, count in sorted(all_topics.items(), key=lambda x: x[1], reverse=True):
            report.append(f"| **{topic}** | {count} |")
    else:
        report.append("Aucun topic identifié.\n")
    report.append("")

    # Agents
    report.append("### Agents Détectés\n")
    if all_agents:
        report.append("| Agent | Mentions |")
        report.append("|-------|----------|")
        for agent, count in sorted(all_agents.items(), key=lambda x: x[1], reverse=True):
            if agent != 'none':
                report.append(f"| **{agent}** | {count} |")
    else:
        report.append("Aucun agent détecté.\n")
    report.append("")

    # Urgence
    report.append("### Niveaux d'Urgence\n")
    report.append("| Niveau | Nombre de fichiers |")
    report.append("|--------|-------------------|")
    report.append(f"| 🔴 **High** | {urgency_counts['high']} |")
    report.append(f"| 🟡 **Medium** | {urgency_counts['medium']} |")
    report.append(f"| 🟢 **Low** | {urgency_counts['low']} |")
    report.append("")

    # Fichiers urgents
    urgent_files = [f for f in tagged_files if f['tags'].get('urgency') == 'high']
    if urgent_files:
        report.append("## ⚠️ Fichiers Urgents\n")
        for file in urgent_files:
            report.append(f"- **{file['name']}**")
            topics = file['tags'].get('topics', [])
            report.append(f"  - Topics: {', '.join(topics)}")
            report.append("")

    # Exemples de fichiers taggés
    report.append("## 📄 Exemples de Fichiers Taggés\n")
    for idx, file in enumerate(tagged_files[:3], 1):
        report.append(f"### {idx}. {file['name']}\n")
        report.append(f"- **Chemin**: `{file['path']}`")
        report.append(f"- **Taille**: {file['size']} bytes")

        tags = file['tags']
        report.append(f"- **Type**: {tags.get('type', 'unknown')}")

        if 'content_type' in tags:
            report.append(f"- **Type de contenu**: {tags['content_type']}")

        if 'topics' in tags:
            report.append(f"- **Topics**: {', '.join(tags['topics'])}")

        if 'agents' in tags:
            agents = [a for a in tags['agents'] if a != 'none']
            if agents:
                report.append(f"- **Agents**: {', '.join(agents)}")

        if 'urgency' in tags:
            urgency_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}
            report.append(f"- **Urgence**: {urgency_emoji.get(tags['urgency'], '')} {tags['urgency']}")

        if 'keywords' in tags:
            report.append(f"- **Mots-clés**: {', '.join(tags['keywords'][:5])}")

        report.append("")

    # Patterns trouvés
    report.append("## 🔍 Patterns Identifiés\n")

    # Patterns de dates
    dates = []
    for file in tagged_files:
        detected = file['tags'].get('detected_dates', [])
        if detected and detected != ['none']:
            dates.extend(detected)

    if dates:
        unique_dates = sorted(set(dates), reverse=True)
        report.append(f"### Dates détectées dans les fichiers\n")
        for date in unique_dates[:5]:
            report.append(f"- {date}")
        report.append("")

    # Fichiers techniques
    tech_files = [f for f in tagged_files if f['tags'].get('has_technical_content')]
    report.append(f"### Fichiers avec contenu technique: {len(tech_files)}\n")

    # Conclusion
    report.append("## 📌 Conclusion\n")
    report.append(f"Le système a analysé **{stats['total_files']} fichiers** ")
    report.append(f"et identifié **{len(all_topics)} topics différents** ")
    report.append(f"avec **{urgency_counts['high']} fichiers urgents** nécessitant une attention immédiate.\n")

    report.append("---\n")
    report.append("*Rapport généré automatiquement par Skynet File Tagger v1.0*")

    # Écrire le rapport
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report))
        print(f"[REPORT] Rapport généré: {output_path}")
    except Exception as e:
        print(f"[ERROR] Impossible de générer le rapport: {e}")


def main():
    """
    Fonction principale - Orchestration complète
    """
    print("=" * 70)
    print(" 🤖 SKYNET FILE TAGGER v1.0 - Système d'Analyse de Fichiers")
    print("=" * 70)

    # Chemins
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    scan_dir = project_root / "scans"
    output_dir = project_root / "outputs"

    # Créer le dossier outputs s'il n'existe pas
    output_dir.mkdir(exist_ok=True)

    # Chemins de sortie
    json_output = output_dir / "tags_output.json"
    md_output = output_dir / "report.md"

    print(f"\n📁 Dossier à scanner: {scan_dir}")
    print(f"💾 Fichier de sortie JSON: {json_output}")
    print(f"📄 Rapport Markdown: {md_output}\n")

    # Vérifier que le dossier existe
    if not scan_dir.exists():
        print(f"[ERROR] Le dossier {scan_dir} n'existe pas!")
        return

    # ÉTAPE 1: Scanner les fichiers
    print("\n" + "=" * 70)
    print("ÉTAPE 1: SCAN DES FICHIERS")
    print("=" * 70)
    files_info = scan_directory(str(scan_dir), recursive=True)

    if not files_info:
        print("[ERROR] Aucun fichier trouvé!")
        return

    # Statistiques
    stats = get_scan_statistics(files_info)

    # ÉTAPE 2: Tagger les fichiers
    print("\n" + "=" * 70)
    print("ÉTAPE 2: TAGGING DES FICHIERS")
    print("=" * 70)
    tagged_files = tag_all_files(files_info)

    # ÉTAPE 3: Sauvegarder les résultats
    print("\n" + "=" * 70)
    print("ÉTAPE 3: GÉNÉRATION DES OUTPUTS")
    print("=" * 70)

    # Sauvegarder le JSON
    save_tags_to_json(tagged_files, str(json_output))

    # Générer le rapport Markdown
    generate_markdown_report(tagged_files, stats, str(md_output))

    # Résumé final
    print("\n" + "=" * 70)
    print("✅ TRAITEMENT TERMINÉ AVEC SUCCÈS")
    print("=" * 70)
    print(f"📊 {len(tagged_files)} fichiers analysés et taggés")
    print(f"💾 Résultats disponibles dans: {output_dir}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
