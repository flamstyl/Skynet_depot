#!/usr/bin/env python3
"""
MCP Obsidian Core - RAG Manager
Système de Retrieval-Augmented Generation simple basé sur des chunks Markdown
"""

import json
import hashlib
import re
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging

# Configuration
MCP_ROOT = Path(__file__).parent.parent.parent
CHUNK_SIZE = 500  # Nombre de caractères par chunk
OVERLAP = 50  # Chevauchement entre chunks

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("RAGManager")


class Chunk:
    """Représente un chunk de texte"""

    def __init__(self, chunk_id: str, source: str, content: str, keywords: List[str], metadata: Dict[str, Any]):
        """
        Initialise un chunk

        Args:
            chunk_id: Identifiant unique du chunk
            source: Fichier source
            content: Contenu du chunk
            keywords: Mots-clés extraits
            metadata: Métadonnées additionnelles
        """
        self.chunk_id = chunk_id
        self.source = source
        self.content = content
        self.keywords = keywords
        self.metadata = metadata

    def to_dict(self) -> Dict[str, Any]:
        """
        Convertit le chunk en dictionnaire

        Returns:
            Dictionnaire représentant le chunk
        """
        return {
            "id": self.chunk_id,
            "source": self.source,
            "content": self.content,
            "keywords": self.keywords,
            "metadata": self.metadata
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Chunk':
        """
        Crée un chunk depuis un dictionnaire

        Args:
            data: Dictionnaire de données

        Returns:
            Instance de Chunk
        """
        return cls(
            chunk_id=data['id'],
            source=data['source'],
            content=data['content'],
            keywords=data['keywords'],
            metadata=data['metadata']
        )


class RAGManager:
    """Gestionnaire du système RAG pour un agent"""

    def __init__(self, agent_name: str):
        """
        Initialise le RAG manager

        Args:
            agent_name: Nom de l'agent
        """
        self.agent_name = agent_name
        self.agent_path = MCP_ROOT / agent_name
        self.rag_path = self.agent_path / "rag"
        self.chunks_path = self.rag_path / "chunks"
        self.index_path = self.rag_path / "rag_index.json"

        # Créer les dossiers si nécessaire
        self.chunks_path.mkdir(parents=True, exist_ok=True)

        # Charger l'index
        self.index = self._load_index()

        logger.info(f"RAG Manager initialisé pour {agent_name}")

    def _load_index(self) -> Dict[str, Any]:
        """
        Charge l'index RAG depuis le fichier JSON

        Returns:
            Index RAG
        """
        if not self.index_path.exists():
            return {
                "version": "1.0.0",
                "agent": self.agent_name,
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat(),
                "chunks": []
            }

        try:
            with open(self.index_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading index: {e}")
            return {"chunks": []}

    def _save_index(self):
        """Sauvegarde l'index RAG"""
        self.index['updated'] = datetime.now().isoformat()

        try:
            with open(self.index_path, 'w', encoding='utf-8') as f:
                json.dump(self.index, f, indent=2, ensure_ascii=False)
            logger.debug(f"Index sauvegardé: {len(self.index['chunks'])} chunks")
        except Exception as e:
            logger.error(f"Error saving index: {e}")

    def _extract_keywords(self, text: str) -> List[str]:
        """
        Extrait les mots-clés d'un texte

        Args:
            text: Texte source

        Returns:
            Liste de mots-clés
        """
        # Nettoyer le texte
        text = text.lower()

        # Supprimer la ponctuation et les caractères spéciaux
        text = re.sub(r'[^\w\s]', ' ', text)

        # Extraire les mots
        words = text.split()

        # Mots vides à ignorer (stopwords français et anglais basiques)
        stopwords = {
            'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou',
            'à', 'au', 'aux', 'pour', 'par', 'dans', 'sur', 'avec', 'sans',
            'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'at', 'for',
            'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'ce', 'cette', 'ces', 'il', 'elle', 'ils', 'elles'
        }

        # Filtrer les mots courts et stopwords
        keywords = [
            word for word in words
            if len(word) > 3 and word not in stopwords
        ]

        # Retourner les mots-clés uniques, limiter à 20
        return list(set(keywords))[:20]

    def _create_chunks(self, content: str, source: str) -> List[Chunk]:
        """
        Découpe un texte en chunks

        Args:
            content: Contenu à découper
            source: Fichier source

        Returns:
            Liste de chunks
        """
        chunks = []

        # Découper par paragraphes d'abord (pour garder la cohérence)
        paragraphs = content.split('\n\n')

        current_chunk = ""
        chunk_number = 1

        for paragraph in paragraphs:
            # Si ajouter ce paragraphe dépasse la taille du chunk
            if len(current_chunk) + len(paragraph) > CHUNK_SIZE and current_chunk:
                # Sauvegarder le chunk actuel
                chunk_id = self._generate_chunk_id(source, chunk_number)
                keywords = self._extract_keywords(current_chunk)

                chunk = Chunk(
                    chunk_id=chunk_id,
                    source=source,
                    content=current_chunk.strip(),
                    keywords=keywords,
                    metadata={
                        "chunk_number": chunk_number,
                        "char_count": len(current_chunk),
                        "created": datetime.now().isoformat()
                    }
                )

                chunks.append(chunk)

                # Commencer un nouveau chunk avec chevauchement
                overlap_text = current_chunk[-OVERLAP:] if len(current_chunk) > OVERLAP else current_chunk
                current_chunk = overlap_text + "\n\n" + paragraph
                chunk_number += 1
            else:
                # Ajouter au chunk actuel
                if current_chunk:
                    current_chunk += "\n\n" + paragraph
                else:
                    current_chunk = paragraph

        # Sauvegarder le dernier chunk
        if current_chunk:
            chunk_id = self._generate_chunk_id(source, chunk_number)
            keywords = self._extract_keywords(current_chunk)

            chunk = Chunk(
                chunk_id=chunk_id,
                source=source,
                content=current_chunk.strip(),
                keywords=keywords,
                metadata={
                    "chunk_number": chunk_number,
                    "char_count": len(current_chunk),
                    "created": datetime.now().isoformat()
                }
            )

            chunks.append(chunk)

        logger.info(f"Créé {len(chunks)} chunks depuis {source}")
        return chunks

    def _generate_chunk_id(self, source: str, chunk_number: int) -> str:
        """
        Génère un ID unique pour un chunk

        Args:
            source: Fichier source
            chunk_number: Numéro du chunk

        Returns:
            ID unique
        """
        # Hash du source + numéro
        hash_input = f"{source}_{chunk_number}".encode('utf-8')
        hash_value = hashlib.md5(hash_input).hexdigest()[:8]
        return f"{hash_value}_{chunk_number:03d}"

    def index_file(self, file_path: Path):
        """
        Indexe un fichier Markdown

        Args:
            file_path: Chemin du fichier à indexer
        """
        logger.info(f"Indexation de {file_path}")

        # Lire le fichier
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            logger.error(f"Error reading file: {e}")
            return

        # Créer les chunks
        chunks = self._create_chunks(content, str(file_path.name))

        # Supprimer les anciens chunks de ce fichier
        self.index['chunks'] = [
            c for c in self.index['chunks']
            if c.get('source') != str(file_path.name)
        ]

        # Ajouter les nouveaux chunks à l'index
        for chunk in chunks:
            self.index['chunks'].append(chunk.to_dict())

            # Sauvegarder le chunk dans un fichier
            chunk_file = self.chunks_path / f"{chunk.chunk_id}.md"
            with open(chunk_file, 'w', encoding='utf-8') as f:
                f.write(f"# Chunk {chunk.chunk_id}\n\n")
                f.write(f"**Source**: {chunk.source}\n")
                f.write(f"**Keywords**: {', '.join(chunk.keywords)}\n\n")
                f.write("---\n\n")
                f.write(chunk.content)

        # Sauvegarder l'index
        self._save_index()

        logger.info(f"Fichier indexé: {len(chunks)} chunks créés")

    def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Recherche des chunks pertinents

        Args:
            query: Requête de recherche
            max_results: Nombre maximum de résultats

        Returns:
            Liste de chunks pertinents avec leur score
        """
        logger.info(f"Recherche: '{query}'")

        # Extraire les mots-clés de la requête
        query_keywords = self._extract_keywords(query)

        results = []

        # Calculer le score de chaque chunk
        for chunk_data in self.index['chunks']:
            chunk_keywords = chunk_data.get('keywords', [])
            content = chunk_data.get('content', '')

            # Score basé sur les mots-clés communs
            keyword_matches = len(set(query_keywords) & set(chunk_keywords))

            # Score basé sur la présence de la requête dans le contenu
            content_lower = content.lower()
            query_lower = query.lower()
            content_match = 1 if query_lower in content_lower else 0

            # Score total
            score = keyword_matches * 2 + content_match * 5

            if score > 0:
                results.append({
                    "chunk": chunk_data,
                    "score": score,
                    "keyword_matches": keyword_matches,
                    "content_match": bool(content_match)
                })

        # Trier par score décroissant
        results.sort(key=lambda x: x['score'], reverse=True)

        # Limiter les résultats
        results = results[:max_results]

        logger.info(f"Trouvé {len(results)} résultat(s)")

        return results

    def get_chunk(self, chunk_id: str) -> Optional[Dict[str, Any]]:
        """
        Récupère un chunk par son ID

        Args:
            chunk_id: ID du chunk

        Returns:
            Données du chunk ou None
        """
        for chunk_data in self.index['chunks']:
            if chunk_data['id'] == chunk_id:
                return chunk_data
        return None

    def stats(self) -> Dict[str, Any]:
        """
        Retourne des statistiques sur le RAG

        Returns:
            Statistiques
        """
        total_chunks = len(self.index['chunks'])
        sources = set(c['source'] for c in self.index['chunks'])
        total_chars = sum(c['metadata']['char_count'] for c in self.index['chunks'])

        return {
            "total_chunks": total_chunks,
            "total_sources": len(sources),
            "sources": list(sources),
            "total_characters": total_chars,
            "average_chunk_size": total_chars // total_chunks if total_chunks > 0 else 0,
            "index_updated": self.index.get('updated', 'Unknown')
        }


def main():
    """Point d'entrée principal pour tests"""
    import sys

    if len(sys.argv) < 2:
        print("Usage: python rag_manager.py <agent_name> [command]")
        print("Commands:")
        print("  index <file>    - Index a file")
        print("  search <query>  - Search for chunks")
        print("  stats           - Show RAG statistics")
        sys.exit(1)

    agent_name = sys.argv[1]
    rag = RAGManager(agent_name)

    if len(sys.argv) >= 3:
        command = sys.argv[2]

        if command == "index" and len(sys.argv) >= 4:
            file_path = Path(sys.argv[3])
            if file_path.exists():
                rag.index_file(file_path)
            else:
                print(f"File not found: {file_path}")

        elif command == "search" and len(sys.argv) >= 4:
            query = ' '.join(sys.argv[3:])
            results = rag.search(query)

            print(f"\nRésultats pour: '{query}'")
            print("=" * 60)

            for i, result in enumerate(results, 1):
                chunk = result['chunk']
                print(f"\n{i}. Chunk {chunk['id']} (Score: {result['score']})")
                print(f"   Source: {chunk['source']}")
                print(f"   Keywords: {', '.join(chunk['keywords'][:5])}")
                print(f"   Preview: {chunk['content'][:150]}...")

        elif command == "stats":
            stats = rag.stats()
            print("\nStatistiques RAG")
            print("=" * 60)
            for key, value in stats.items():
                print(f"{key}: {value}")

    else:
        # Afficher les stats par défaut
        stats = rag.stats()
        print(f"\nRAG Manager - {agent_name}")
        print("=" * 60)
        for key, value in stats.items():
            print(f"{key}: {value}")


if __name__ == "__main__":
    main()
