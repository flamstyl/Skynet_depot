#!/usr/bin/env python3
"""
Skynet Tagger v1.0
Module de tagging automatique intelligent pour fichiers

Ce module analyse les fichiers (texte et binaires) et attribue
des tags pertinents pour faciliter la recherche et le RAG.
"""

import re
import json
from typing import Dict, List, Set
from collections import Counter
from datetime import datetime


# ============================================================================
# DICTIONNAIRES DE MOTS-CLÉS POUR DÉTECTION
# ============================================================================

URGENCY_KEYWORDS = {
    'urgent': 3,
    'critique': 3,
    'critical': 3,
    'immédiatement': 3,
    'immediately': 3,
    'priorité': 2,
    'priority': 2,
    'important': 2,
    'asap': 3,
    'haute': 2,
    'high': 2
}

AGENT_KEYWORDS = {
    'gemini': 'gemini',
    'claude': 'claude',
    'gpt': 'gpt',
    'reflector': 'reflector',
    'saf': 'saf',
    'agent': 'agent_generic'
}

TOPIC_KEYWORDS = {
    'ia': ['ia', 'intelligence artificielle', 'ai', 'machine learning', 'ml'],
    'system': ['système', 'system', 'architecture', 'infrastructure'],
    'log': ['log', 'error', 'warning', 'debug', 'trace'],
    'code': ['code', 'fonction', 'function', 'class', 'module', 'script'],
    'config': ['config', 'configuration', 'paramètre', 'settings'],
    'rapport': ['rapport', 'report', 'analyse', 'analysis'],
    'journal': ['journal', 'diary', 'note', 'observation'],
    'memoire': ['mémoire', 'memory', 'storage', 'cache'],
    'rag': ['rag', 'retrieval', 'embedding', 'vectorstore'],
    'reflexion': ['réflexion', 'reflection', 'pensée', 'thought']
}

TYPE_KEYWORDS = {
    'technique': ['error', 'warning', 'debug', 'code', 'function', 'module'],
    'journal': ['journal', 'observation', 'note', 'diary'],
    'configuration': ['config', 'paramètre', 'settings', 'setup'],
    'documentation': ['documentation', 'readme', 'guide', 'tutorial'],
    'log': ['log', 'trace', 'error', 'warning', 'info']
}


# ============================================================================
# FONCTIONS DE DÉTECTION
# ============================================================================

def detect_dates(text: str) -> List[str]:
    """
    Détecte les dates dans le texte.

    Args:
        text: Texte à analyser

    Returns:
        Liste des dates détectées au format ISO
    """
    dates = []

    # Pattern pour dates ISO (YYYY-MM-DD)
    iso_pattern = r'\b(\d{4}-\d{2}-\d{2})\b'
    dates.extend(re.findall(iso_pattern, text))

    # Pattern pour dates françaises (DD/MM/YYYY)
    fr_pattern = r'\b(\d{2}/\d{2}/\d{4})\b'
    fr_dates = re.findall(fr_pattern, text)
    for date_str in fr_dates:
        try:
            # Convertir en format ISO
            d, m, y = date_str.split('/')
            dates.append(f"{y}-{m}-{d}")
        except:
            pass

    # Pattern pour "Date: YYYY-MM-DD"
    date_field_pattern = r'Date:\s*(\d{4}-\d{2}-\d{2})'
    dates.extend(re.findall(date_field_pattern, text))

    return list(set(dates))  # Retirer les doublons


def detect_urgency(text: str) -> str:
    """
    Détecte le niveau d'urgence dans le texte.

    Args:
        text: Texte à analyser

    Returns:
        Niveau d'urgence: 'high', 'medium', 'low'
    """
    text_lower = text.lower()
    max_score = 0

    for keyword, score in URGENCY_KEYWORDS.items():
        if keyword in text_lower:
            max_score = max(max_score, score)

    if max_score >= 3:
        return 'high'
    elif max_score >= 2:
        return 'medium'
    else:
        return 'low'


def detect_agents(text: str) -> List[str]:
    """
    Détecte les mentions d'agents dans le texte.

    Args:
        text: Texte à analyser

    Returns:
        Liste des agents détectés
    """
    text_lower = text.lower()
    agents = []

    for keyword, agent_name in AGENT_KEYWORDS.items():
        if keyword in text_lower:
            agents.append(agent_name)

    return list(set(agents))


def detect_topics(text: str) -> List[str]:
    """
    Détecte les topics/thèmes dans le texte.

    Args:
        text: Texte à analyser

    Returns:
        Liste des topics détectés
    """
    text_lower = text.lower()
    detected_topics = []

    for topic, keywords in TOPIC_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                detected_topics.append(topic)
                break  # Un seul match par topic suffit

    return list(set(detected_topics))


def detect_type(text: str) -> str:
    """
    Détecte le type de document basé sur son contenu.

    Args:
        text: Texte à analyser

    Returns:
        Type de document détecté
    """
    text_lower = text.lower()
    scores = {}

    for doc_type, keywords in TYPE_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[doc_type] = score

    if scores:
        # Retourner le type avec le plus haut score
        return max(scores, key=scores.get)
    else:
        return 'general'


def extract_keywords(text: str, top_n: int = 10) -> List[str]:
    """
    Extrait les mots-clés les plus fréquents du texte.

    Args:
        text: Texte à analyser
        top_n: Nombre de mots-clés à retourner

    Returns:
        Liste des mots-clés les plus fréquents
    """
    # Nettoyer et tokeniser
    text_lower = text.lower()
    # Retirer la ponctuation
    text_clean = re.sub(r'[^\w\s]', ' ', text_lower)
    words = text_clean.split()

    # Stop words simples à ignorer
    stop_words = {
        'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du',
        'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car',
        'ce', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes',
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
        'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was'
    }

    # Filtrer les mots courts et stop words
    meaningful_words = [
        w for w in words
        if len(w) > 3 and w not in stop_words
    ]

    # Compter les occurrences
    word_counts = Counter(meaningful_words)

    # Retourner les top N
    return [word for word, count in word_counts.most_common(top_n)]


# ============================================================================
# TAGGING PRINCIPAL
# ============================================================================

def tag_text_file(file_path: str, content: str) -> Dict:
    """
    Analyse un fichier texte et génère des tags.

    Args:
        file_path: Chemin du fichier
        content: Contenu du fichier

    Returns:
        Dictionnaire de tags
    """
    # Détections
    dates = detect_dates(content)
    urgency = detect_urgency(content)
    agents = detect_agents(content)
    topics = detect_topics(content)
    doc_type = detect_type(content)
    keywords = extract_keywords(content, top_n=5)

    # Construction du tagset
    tags = {
        "type": "text",
        "content_type": doc_type,
        "urgency": urgency,
        "topics": topics if topics else ["general"],
        "agents": agents if agents else ["none"],
        "keywords": keywords,
        "detected_dates": dates if dates else ["none"],
        "has_technical_content": any(t in topics for t in ['code', 'system', 'log'])
    }

    return tags


def tag_binary_file(file_path: str, extension: str, mime_type: str) -> Dict:
    """
    Génère des tags pour un fichier binaire basé sur son extension.

    Args:
        file_path: Chemin du fichier
        extension: Extension du fichier
        mime_type: Type MIME

    Returns:
        Dictionnaire de tags
    """
    # Mapping extension -> type
    extension_mapping = {
        # Images
        '.png': 'image',
        '.jpg': 'image',
        '.jpeg': 'image',
        '.gif': 'image',
        '.bmp': 'image',
        '.svg': 'image',
        '.webp': 'image',

        # Audio
        '.mp3': 'audio',
        '.wav': 'audio',
        '.ogg': 'audio',
        '.flac': 'audio',
        '.m4a': 'audio',

        # Vidéo
        '.mp4': 'video',
        '.avi': 'video',
        '.mkv': 'video',
        '.mov': 'video',
        '.webm': 'video',

        # Documents
        '.pdf': 'pdf',
        '.doc': 'document',
        '.docx': 'document',
        '.xls': 'spreadsheet',
        '.xlsx': 'spreadsheet',
        '.ppt': 'presentation',
        '.pptx': 'presentation',

        # Archives
        '.zip': 'archive',
        '.tar': 'archive',
        '.gz': 'archive',
        '.rar': 'archive',
        '.7z': 'archive',

        # Exécutables
        '.exe': 'executable',
        '.dll': 'library',
        '.so': 'library',
        '.app': 'executable'
    }

    file_type = extension_mapping.get(extension.lower(), 'binary')

    tags = {
        "type": file_type,
        "content_type": "binary",
        "mime_type": mime_type,
        "urgency": "low",
        "topics": ["binary"],
        "agents": ["none"]
    }

    return tags


def tag_file(file_info: Dict) -> Dict:
    """
    Fonction principale de tagging pour un fichier.

    Args:
        file_info: Dictionnaire contenant les infos du fichier

    Returns:
        Dictionnaire contenant le path et les tags
    """
    result = {
        "path": file_info['path'],
        "name": file_info['name'],
        "size": file_info['size'],
        "tags": {}
    }

    try:
        if file_info['is_text']:
            # Lire le contenu du fichier texte
            with open(file_info['path'], 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            result['tags'] = tag_text_file(file_info['path'], content)
        else:
            # Fichier binaire
            result['tags'] = tag_binary_file(
                file_info['path'],
                file_info['extension'],
                file_info['mime_type']
            )

    except Exception as e:
        print(f"[ERROR] Impossible de tagger {file_info['name']}: {e}")
        result['tags'] = {
            "type": "error",
            "error": str(e)
        }

    return result


def tag_all_files(files_info: List[Dict]) -> List[Dict]:
    """
    Tagge tous les fichiers d'une liste.

    Args:
        files_info: Liste des informations de fichiers

    Returns:
        Liste des fichiers avec leurs tags
    """
    print(f"\n[TAGGING] Démarrage du tagging de {len(files_info)} fichiers...\n")

    tagged_files = []
    for idx, file_info in enumerate(files_info, 1):
        print(f"[{idx}/{len(files_info)}] Tagging: {file_info['name']}")
        tagged = tag_file(file_info)
        tagged_files.append(tagged)

    print(f"\n[TAGGING] Terminé! {len(tagged_files)} fichiers taggés.\n")

    return tagged_files


def save_tags_to_json(tagged_files: List[Dict], output_path: str):
    """
    Sauvegarde les tags dans un fichier JSON.

    Args:
        tagged_files: Liste des fichiers taggés
        output_path: Chemin du fichier de sortie
    """
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(tagged_files, f, indent=2, ensure_ascii=False)
        print(f"[SAVE] Tags sauvegardés dans: {output_path}")
    except Exception as e:
        print(f"[ERROR] Impossible de sauvegarder les tags: {e}")


def main():
    """
    Fonction principale pour tester le tagger.
    """
    # Test avec un exemple de texte
    test_text = """
    Date: 2025-11-18
    Agent: Gemini

    URGENT: Le système de mémoire atteint sa capacité maximale.
    Intervention nécessaire pour optimiser les embeddings et le RAG.
    """

    print("Test du tagger avec un exemple:")
    print("-" * 60)
    tags = tag_text_file("test.txt", test_text)
    print(json.dumps(tags, indent=2, ensure_ascii=False))
    print("-" * 60)


if __name__ == "__main__":
    main()
