"""
Module de récupération de mémoire pour le Synapse Planner.
Simule l'accès à la mémoire RAG et aux notes des agents Skynet.
"""

import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any


def fetch_recent_memory() -> List[str]:
    """
    Récupère les entrées mémoire récentes (dernières 24h simulées).

    Returns:
        Liste de strings représentant les notes mémoire récentes
    """
    memory_entries = [
        "Gemini a indexé 12 nouveaux articles sur l'IA générative.",
        "Echo a détecté une tendance croissante sur les modèles multimodaux.",
        "Reflector a produit une synthèse de 2400 mots sur l'état actuel des LLMs.",
        "Memory Manager a consolidé 156 entrées dans la base RAG.",
        "SAF a marqué 3 dossiers comme critiques suite aux changements récents.",
        "Drive Sync a mis à jour la documentation technique (v2.3.1).",
        "Gemini recommande la lecture de 'Attention Is All You Need' - revisité.",
        "Echo a archivé 45 conversations de faible priorité.",
        "Note personnelle : Vérifier l'intégration du nouveau module de planning.",
        "Reflector suggère une révision des priorités de surveillance."
    ]

    # Retourner 5 à 8 entrées aléatoires
    num_entries = random.randint(5, 8)
    return random.sample(memory_entries, num_entries)


def fetch_agent_notes() -> List[Dict[str, str]]:
    """
    Récupère les notes et observations des agents actifs.

    Returns:
        Liste de dictionnaires contenant agent, timestamp et note
    """
    agents_notes = [
        {
            "agent": "Gemini",
            "timestamp": "09:12",
            "note": "Erreur de parsing détectée sur un fichier PDF corrompu - résolu."
        },
        {
            "agent": "Reflector",
            "timestamp": "22:42",
            "note": "Rapport nocturne généré - 15 insights majeurs identifiés."
        },
        {
            "agent": "SAF",
            "timestamp": "08:00",
            "note": "Tous les agents opérationnels - Performance globale à 94%."
        },
        {
            "agent": "Echo",
            "timestamp": "07:30",
            "note": "Latence API légèrement élevée ce matin (2.3s) - surveillance active."
        },
        {
            "agent": "Drive Sync",
            "timestamp": "08:12",
            "note": "45 fichiers synchronisés - Aucune corruption détectée."
        },
        {
            "agent": "Memory Manager",
            "timestamp": "08:30",
            "note": "Consolidation RAG en cours - Optimisation de l'indexation vectorielle."
        },
        {
            "agent": "Gemini",
            "timestamp": "07:22",
            "note": "Analyse IA terminée - Découverte de 3 nouveaux frameworks intéressants."
        }
    ]

    # Retourner 4 à 6 notes
    num_notes = random.randint(4, 6)
    return random.sample(agents_notes, num_notes)


def fetch_alerts() -> List[Dict[str, Any]]:
    """
    Récupère les alertes et événements importants nécessitant attention.

    Returns:
        Liste de dictionnaires contenant type, priorité et message
    """
    alerts = [
        {
            "type": "performance",
            "priority": "medium",
            "message": "Utilisation CPU à 78% - Monitoring actif.",
            "timestamp": "09:30"
        },
        {
            "type": "sync",
            "priority": "low",
            "message": "Drive Sync : Prochain backup planifié à 14:00.",
            "timestamp": "10:00"
        },
        {
            "type": "security",
            "priority": "high",
            "message": "Nouvelle vulnérabilité détectée - Mise à jour recommandée.",
            "timestamp": "06:15"
        },
        {
            "type": "api",
            "priority": "medium",
            "message": "Echo : Timeout API externe - Réessai automatique réussi.",
            "timestamp": "08:45"
        },
        {
            "type": "memory",
            "priority": "low",
            "message": "Espace disque à 65% - Nettoyage suggéré dans 7 jours.",
            "timestamp": "07:00"
        }
    ]

    # Filtrer seulement les alertes de priorité medium ou high
    important_alerts = [a for a in alerts if a["priority"] in ["medium", "high"]]

    return important_alerts


def fetch_recommendations() -> List[str]:
    """
    Génère des recommandations basées sur les patterns détectés.

    Returns:
        Liste de recommandations actionables
    """
    recommendations = [
        "Planifier une révision des dossiers critiques cette semaine.",
        "Optimiser les requêtes API pour réduire la latence moyenne.",
        "Archiver les logs de plus de 30 jours pour libérer de l'espace.",
        "Mettre à jour la documentation suite aux changements récents.",
        "Réviser les priorités de surveillance basées sur l'activité récente.",
        "Programmer un audit de sécurité complet.",
        "Consolider les synthèses des 7 derniers jours.",
        "Vérifier l'intégrité de la base RAG.",
        "Configurer des alertes supplémentaires pour les pics de CPU."
    ]

    # Retourner 3 à 5 recommandations
    num_recs = random.randint(3, 5)
    return random.sample(recommendations, num_recs)


def get_memory_summary() -> Dict[str, Any]:
    """
    Génère un résumé complet de la mémoire et des notes.

    Returns:
        Dictionnaire contenant toutes les données mémoire structurées
    """
    return {
        "recent_memory": fetch_recent_memory(),
        "agent_notes": fetch_agent_notes(),
        "alerts": fetch_alerts(),
        "recommendations": fetch_recommendations(),
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


if __name__ == "__main__":
    # Test du module
    print("=== Test Memory Fetcher ===\n")

    print("📘 Mémoire récente:")
    for entry in fetch_recent_memory():
        print(f"  - {entry}")

    print("\n📝 Notes des agents:")
    for note in fetch_agent_notes():
        print(f"  [{note['timestamp']}] {note['agent']}: {note['note']}")

    print("\n🚨 Alertes importantes:")
    for alert in fetch_alerts():
        print(f"  [{alert['priority'].upper()}] {alert['message']}")

    print("\n💡 Recommandations:")
    for rec in fetch_recommendations():
        print(f"  - {rec}")

    print("\n✅ Test terminé!")
