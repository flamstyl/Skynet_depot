"""
Vector Store - Storage and retrieval of project embeddings for RAG
"""

import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional
import json
import pickle

from rich.console import Console

try:
    import chromadb
    from chromadb.config import Settings

    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False

from .embeddings import EmbeddingEngine


class VectorStore:
    """Manages vector storage for RAG"""

    def __init__(self, config: dict):
        self.config = config
        self.console = Console()

        # Initialize embedding engine
        self.embedding_engine = EmbeddingEngine(config)

        # Vector store configuration
        self.store_path = Path(config["memory"]["vector_store_path"])
        self.chunk_size = config["memory"]["chunk_size"]
        self.chunk_overlap = config["memory"]["chunk_overlap"]

        # Initialize ChromaDB
        if CHROMA_AVAILABLE:
            self._init_chromadb()
        else:
            self.console.print(
                "[yellow]Warning: ChromaDB not installed. Vector search disabled.[/yellow]"
            )
            self.client = None
            self.collection = None

    def _init_chromadb(self):
        """Initialize ChromaDB client and collection"""
        try:
            # Create directory if needed
            self.store_path.mkdir(parents=True, exist_ok=True)

            # Initialize client
            self.client = chromadb.PersistentClient(
                path=str(self.store_path),
                settings=Settings(anonymized_telemetry=False),
            )

            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name="grok_cli_knowledge",
                metadata={"description": "Grok CLI project knowledge base"},
            )

        except Exception as e:
            self.console.print(f"[red]Failed to initialize ChromaDB: {e}[/red]")
            self.client = None
            self.collection = None

    async def index_project(self, analysis: Dict):
        """Index entire project for RAG"""
        if not self.collection:
            return

        self.console.print("[cyan]Indexing project files...[/cyan]")

        documents = []
        metadatas = []
        ids = []

        # Index critical files
        for file_path in analysis.get("critical_files", []):
            doc, meta = await self._process_file(
                Path(analysis["path"]) / file_path
            )
            if doc:
                documents.append(doc)
                metadatas.append(meta)
                ids.append(f"file_{len(ids)}")

        # Index entry points
        for entry in analysis.get("entry_points", []):
            if isinstance(entry, str) and not entry.startswith("npm"):
                doc, meta = await self._process_file(
                    Path(analysis["path"]) / entry
                )
                if doc:
                    documents.append(doc)
                    metadatas.append(meta)
                    ids.append(f"file_{len(ids)}")

        # Add project analysis as document
        analysis_doc = self._format_analysis_for_indexing(analysis)
        documents.append(analysis_doc)
        metadatas.append(
            {"type": "project_analysis", "file": "analysis.json"}
        )
        ids.append("project_analysis")

        # Add to collection
        if documents:
            try:
                self.collection.add(
                    documents=documents, metadatas=metadatas, ids=ids
                )
                self.console.print(
                    f"[green]✓ Indexed {len(documents)} documents[/green]"
                )
            except Exception as e:
                self.console.print(
                    f"[red]Failed to index documents: {e}[/red]"
                )

    async def _process_file(
        self, file_path: Path
    ) -> tuple[Optional[str], Optional[Dict]]:
        """Process a file for indexing"""
        try:
            if not file_path.exists() or file_path.stat().st_size > 1024 * 1024:
                return None, None

            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            # Chunk if too large
            if len(content) > self.chunk_size:
                # For now, just take first chunk
                content = content[: self.chunk_size]

            metadata = {
                "type": "file",
                "file": str(file_path.name),
                "path": str(file_path),
                "extension": file_path.suffix,
            }

            return content, metadata

        except Exception as e:
            self.console.print(
                f"[yellow]Warning: Could not process {file_path}: {e}[/yellow]"
            )
            return None, None

    def _format_analysis_for_indexing(self, analysis: Dict) -> str:
        """Format project analysis as searchable document"""
        parts = [
            f"Project: {analysis['name']}",
            f"Type: {', '.join(analysis.get('types', []))}",
            f"Languages: {', '.join(analysis.get('languages', {}).keys())}",
            f"Entry points: {', '.join(str(e) for e in analysis.get('entry_points', []))}",
            f"Config files: {', '.join(analysis.get('config_files', []))}",
        ]

        # Add dependencies
        if analysis.get("dependencies"):
            for lang, deps in analysis["dependencies"].items():
                if isinstance(deps, list):
                    parts.append(f"{lang} dependencies: {', '.join(deps[:10])}")
                elif isinstance(deps, dict):
                    for dep_type, dep_list in deps.items():
                        parts.append(
                            f"{lang} {dep_type}: {', '.join(dep_list[:10])}"
                        )

        return "\n".join(parts)

    async def search(
        self, query: str, top_k: int = 5, filter_metadata: Optional[Dict] = None
    ) -> List[Dict]:
        """Search for relevant documents"""
        if not self.collection:
            return []

        try:
            # Search
            results = self.collection.query(
                query_texts=[query],
                n_results=min(top_k, self.collection.count()),
                where=filter_metadata,
            )

            # Format results
            formatted = []
            if results["documents"]:
                for doc, meta, distance in zip(
                    results["documents"][0],
                    results["metadatas"][0],
                    results["distances"][0],
                ):
                    formatted.append(
                        {
                            "content": doc,
                            "metadata": meta,
                            "relevance": 1 - distance,  # Convert distance to similarity
                        }
                    )

            return formatted

        except Exception as e:
            self.console.print(f"[yellow]Search error: {e}[/yellow]")
            return []

    async def add_document(
        self, content: str, metadata: Dict, doc_id: Optional[str] = None
    ):
        """Add a single document to the store"""
        if not self.collection:
            return

        doc_id = doc_id or f"doc_{self.collection.count()}"

        try:
            self.collection.add(
                documents=[content], metadatas=[metadata], ids=[doc_id]
            )
        except Exception as e:
            self.console.print(f"[yellow]Failed to add document: {e}[/yellow]")

    async def update_document(self, doc_id: str, content: str, metadata: Dict):
        """Update an existing document"""
        if not self.collection:
            return

        try:
            self.collection.update(
                ids=[doc_id], documents=[content], metadatas=[metadata]
            )
        except Exception as e:
            self.console.print(
                f"[yellow]Failed to update document: {e}[/yellow]"
            )

    def clear(self):
        """Clear all documents from the store"""
        if not self.collection:
            return

        try:
            # Delete collection and recreate
            self.client.delete_collection("grok_cli_knowledge")
            self.collection = self.client.create_collection(
                name="grok_cli_knowledge",
                metadata={"description": "Grok CLI project knowledge base"},
            )
            self.console.print("[green]✓ Vector store cleared[/green]")
        except Exception as e:
            self.console.print(f"[red]Failed to clear store: {e}[/red]")

    def get_statistics(self) -> Dict:
        """Get statistics about the vector store"""
        if not self.collection:
            return {"enabled": False}

        try:
            count = self.collection.count()
            return {
                "enabled": True,
                "document_count": count,
                "collection_name": self.collection.name,
            }
        except:
            return {"enabled": False}
