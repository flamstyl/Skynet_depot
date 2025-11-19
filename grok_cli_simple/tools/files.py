"""
File Tool - Lecture et écriture de fichiers
"""

from pathlib import Path
from typing import Optional, List


class FileTool:
    """Outil pour gérer les fichiers"""

    def __init__(self, project_root: Optional[Path] = None):
        self.project_root = project_root or Path.cwd()

        # Extensions à ignorer
        self.ignored_extensions = {
            '.pyc', '.pyo', '.pyd', '.so', '.dll', '.dylib',
            '.exe', '.bin', '.obj', '.o', '.a', '.lib',
            '.jpg', '.jpeg', '.png', '.gif', '.ico', '.svg',
            '.mp3', '.mp4', '.avi', '.mov', '.wav',
            '.zip', '.tar', '.gz', '.rar', '.7z'
        }

        # Dossiers à ignorer
        self.ignored_dirs = {
            'node_modules', '.git', '__pycache__', '.venv', 'venv',
            'dist', 'build', '.next', '.nuxt', 'coverage'
        }

    def read_file(self, file_path: str, max_size_mb: int = 1) -> str:
        """
        Lit un fichier

        Args:
            file_path: Chemin du fichier (relatif ou absolu)
            max_size_mb: Taille max en MB

        Returns:
            Contenu du fichier ou message d'erreur
        """
        try:
            path = Path(file_path)
            if not path.is_absolute():
                path = self.project_root / path

            if not path.exists():
                return f"❌ Fichier non trouvé: {file_path}"

            # Vérifier la taille
            size_mb = path.stat().st_size / (1024 * 1024)
            if size_mb > max_size_mb:
                return f"❌ Fichier trop gros ({size_mb:.1f}MB > {max_size_mb}MB)"

            # Lire le fichier
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            return content

        except Exception as e:
            return f"❌ Erreur lecture: {str(e)}"

    def write_file(self, file_path: str, content: str, create_dirs: bool = True) -> str:
        """
        Écrit dans un fichier

        Args:
            file_path: Chemin du fichier
            content: Contenu à écrire
            create_dirs: Créer les dossiers parents si nécessaire

        Returns:
            Message de succès ou d'erreur
        """
        try:
            path = Path(file_path)
            if not path.is_absolute():
                path = self.project_root / path

            # Créer les dossiers parents
            if create_dirs:
                path.parent.mkdir(parents=True, exist_ok=True)

            # Écrire le fichier
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)

            return f"✅ Fichier écrit: {file_path}"

        except Exception as e:
            return f"❌ Erreur écriture: {str(e)}"

    def list_files(self, directory: str = ".", pattern: str = "*") -> List[str]:
        """
        Liste les fichiers d'un dossier

        Args:
            directory: Dossier à lister
            pattern: Pattern de fichiers (ex: "*.py")

        Returns:
            Liste des chemins de fichiers
        """
        try:
            dir_path = Path(directory)
            if not dir_path.is_absolute():
                dir_path = self.project_root / dir_path

            if not dir_path.exists() or not dir_path.is_dir():
                return []

            files = []
            for item in dir_path.rglob(pattern):
                # Ignorer les dossiers exclus
                if any(ignored in item.parts for ignored in self.ignored_dirs):
                    continue

                # Ignorer les extensions exclues
                if item.suffix.lower() in self.ignored_extensions:
                    continue

                if item.is_file():
                    # Chemin relatif au projet
                    rel_path = item.relative_to(self.project_root)
                    files.append(str(rel_path))

            return sorted(files)

        except Exception as e:
            return [f"❌ Erreur: {str(e)}"]

    def file_exists(self, file_path: str) -> bool:
        """Vérifie si un fichier existe"""
        path = Path(file_path)
        if not path.is_absolute():
            path = self.project_root / path
        return path.exists()
