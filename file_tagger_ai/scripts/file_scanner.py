#!/usr/bin/env python3
"""
Skynet File Scanner v1.0
Module de scan récursif de fichiers pour le système de tagging Skynet

Ce module explore un dossier donné, collecte les métadonnées des fichiers
et prépare les données pour le système de tagging.
"""

import os
import mimetypes
from pathlib import Path
from typing import List, Dict


# Configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB en bytes

# Extensions considérées comme texte
TEXT_EXTENSIONS = {
    '.txt', '.md', '.json', '.yaml', '.yml', '.xml', '.csv',
    '.log', '.conf', '.cfg', '.ini', '.py', '.js', '.html',
    '.css', '.sh', '.bat', '.env'
}


def is_text_file(file_path: str) -> bool:
    """
    Détermine si un fichier est de type texte basé sur son extension.

    Args:
        file_path: Chemin du fichier à analyser

    Returns:
        True si le fichier est considéré comme texte, False sinon
    """
    extension = Path(file_path).suffix.lower()
    return extension in TEXT_EXTENSIONS


def get_file_info(file_path: str) -> Dict:
    """
    Collecte les informations d'un fichier donné.

    Args:
        file_path: Chemin absolu du fichier

    Returns:
        Dictionnaire contenant les métadonnées du fichier
    """
    try:
        file_stats = os.stat(file_path)
        extension = Path(file_path).suffix.lower()

        # Détection du type MIME
        mime_type, _ = mimetypes.guess_type(file_path)

        return {
            "path": os.path.abspath(file_path),
            "name": os.path.basename(file_path),
            "size": file_stats.st_size,
            "extension": extension,
            "mime_type": mime_type or "unknown",
            "is_text": is_text_file(file_path),
            "modified": file_stats.st_mtime
        }
    except Exception as e:
        print(f"[WARN] Impossible de lire {file_path}: {e}")
        return None


def scan_directory(directory: str, recursive: bool = True) -> List[Dict]:
    """
    Scanne un dossier et collecte les informations de tous les fichiers.

    Args:
        directory: Chemin du dossier à scanner
        recursive: Si True, scan récursif des sous-dossiers

    Returns:
        Liste de dictionnaires contenant les infos de chaque fichier
    """
    files_info = []
    ignored_count = 0

    print(f"\n[SCAN] Démarrage du scan: {directory}")
    print(f"[SCAN] Mode récursif: {recursive}")
    print(f"[SCAN] Limite de taille: {MAX_FILE_SIZE / (1024*1024):.0f} MB\n")

    try:
        if recursive:
            # Scan récursif avec os.walk
            for root, dirs, files in os.walk(directory):
                # Ignorer les dossiers cachés et système
                dirs[:] = [d for d in dirs if not d.startswith('.')]

                for filename in files:
                    # Ignorer les fichiers cachés
                    if filename.startswith('.'):
                        continue

                    file_path = os.path.join(root, filename)

                    # Vérifier la taille du fichier
                    try:
                        file_size = os.path.getsize(file_path)
                        if file_size > MAX_FILE_SIZE:
                            print(f"[SKIP] Fichier trop volumineux: {filename} ({file_size / (1024*1024):.2f} MB)")
                            ignored_count += 1
                            continue
                    except Exception as e:
                        print(f"[WARN] Impossible de vérifier la taille de {filename}: {e}")
                        continue

                    # Collecter les infos du fichier
                    file_info = get_file_info(file_path)
                    if file_info:
                        files_info.append(file_info)
        else:
            # Scan non-récursif
            for item in os.listdir(directory):
                item_path = os.path.join(directory, item)

                # Ne traiter que les fichiers (pas les dossiers)
                if os.path.isfile(item_path) and not item.startswith('.'):
                    file_size = os.path.getsize(item_path)
                    if file_size > MAX_FILE_SIZE:
                        print(f"[SKIP] Fichier trop volumineux: {item}")
                        ignored_count += 1
                        continue

                    file_info = get_file_info(item_path)
                    if file_info:
                        files_info.append(file_info)

    except Exception as e:
        print(f"[ERROR] Erreur lors du scan: {e}")
        return []

    print(f"\n[RÉSULTAT] {len(files_info)} fichiers scannés")
    print(f"[RÉSULTAT] {ignored_count} fichiers ignorés (taille > 10MB)\n")

    return files_info


def get_scan_statistics(files_info: List[Dict]) -> Dict:
    """
    Génère des statistiques sur les fichiers scannés.

    Args:
        files_info: Liste des informations de fichiers

    Returns:
        Dictionnaire contenant les statistiques
    """
    total_size = sum(f['size'] for f in files_info)
    text_files = sum(1 for f in files_info if f['is_text'])
    binary_files = len(files_info) - text_files

    # Compter les extensions
    extensions = {}
    for f in files_info:
        ext = f['extension'] or 'no_extension'
        extensions[ext] = extensions.get(ext, 0) + 1

    return {
        "total_files": len(files_info),
        "text_files": text_files,
        "binary_files": binary_files,
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / (1024 * 1024), 2),
        "extensions": extensions
    }


def main():
    """
    Fonction principale pour tester le scanner.
    """
    import sys

    # Utiliser le dossier scans par défaut ou celui passé en argument
    if len(sys.argv) > 1:
        scan_path = sys.argv[1]
    else:
        # Chemin par défaut vers le dossier scans
        script_dir = Path(__file__).parent
        scan_path = script_dir.parent / "scans"

    if not os.path.exists(scan_path):
        print(f"[ERROR] Le dossier {scan_path} n'existe pas!")
        return

    # Lancer le scan
    files = scan_directory(str(scan_path))

    # Afficher les statistiques
    stats = get_scan_statistics(files)
    print("=" * 60)
    print("STATISTIQUES DU SCAN")
    print("=" * 60)
    print(f"Total de fichiers: {stats['total_files']}")
    print(f"Fichiers texte: {stats['text_files']}")
    print(f"Fichiers binaires: {stats['binary_files']}")
    print(f"Taille totale: {stats['total_size_mb']} MB")
    print(f"\nExtensions trouvées:")
    for ext, count in sorted(stats['extensions'].items(), key=lambda x: x[1], reverse=True):
        print(f"  {ext}: {count} fichier(s)")
    print("=" * 60)

    # Afficher quelques exemples
    if files:
        print("\nExemples de fichiers scannés:")
        for f in files[:3]:
            print(f"  - {f['name']} ({f['size']} bytes, type: {'TEXT' if f['is_text'] else 'BINARY'})")


if __name__ == "__main__":
    main()
