"""
Embedding Engine - Generate embeddings for text
"""

from typing import List, Optional
import numpy as np

from rich.console import Console

try:
    from sentence_transformers import SentenceTransformer

    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False


class EmbeddingEngine:
    """Generates embeddings for text using sentence transformers"""

    def __init__(self, config: dict):
        self.config = config
        self.console = Console()

        self.model_name = config["memory"]["embedding_model"]
        self.model = None

        if SENTENCE_TRANSFORMERS_AVAILABLE:
            self._load_model()
        else:
            self.console.print(
                "[yellow]Warning: sentence-transformers not installed.[/yellow]"
            )

    def _load_model(self):
        """Load the embedding model"""
        try:
            self.console.print(
                f"[dim]Loading embedding model: {self.model_name}...[/dim]"
            )
            self.model = SentenceTransformer(self.model_name)
            self.console.print("[green]✓ Embedding model loaded[/green]")
        except Exception as e:
            self.console.print(
                f"[red]Failed to load embedding model: {e}[/red]"
            )
            self.model = None

    def embed(self, text: str) -> Optional[List[float]]:
        """Generate embedding for a single text"""
        if not self.model:
            return None

        try:
            embedding = self.model.encode(text, convert_to_numpy=True)
            return embedding.tolist()
        except Exception as e:
            self.console.print(f"[yellow]Embedding error: {e}[/yellow]")
            return None

    def embed_batch(self, texts: List[str]) -> Optional[List[List[float]]]:
        """Generate embeddings for multiple texts"""
        if not self.model:
            return None

        try:
            embeddings = self.model.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()
        except Exception as e:
            self.console.print(f"[yellow]Batch embedding error: {e}[/yellow]")
            return None

    def compute_similarity(
        self, embedding1: List[float], embedding2: List[float]
    ) -> float:
        """Compute cosine similarity between two embeddings"""
        try:
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)

            # Cosine similarity
            similarity = np.dot(vec1, vec2) / (
                np.linalg.norm(vec1) * np.linalg.norm(vec2)
            )

            return float(similarity)
        except Exception as e:
            self.console.print(f"[yellow]Similarity error: {e}[/yellow]")
            return 0.0
