"""
Context Retriever - Retrieve relevant context for queries
"""

from typing import List, Dict, Optional, Any
from dataclasses import dataclass

from rich.console import Console

from .vectorstore import VectorStore


@dataclass
class RetrievedContext:
    """Retrieved context for a query"""

    query: str
    results: List[Dict[str, Any]]
    total_found: int


class ContextRetriever:
    """Retrieves relevant context from vector store"""

    def __init__(self, vectorstore: VectorStore, config: dict):
        self.vectorstore = vectorstore
        self.config = config
        self.console = Console()

        self.top_k = config["rag"]["top_k_results"]
        self.similarity_threshold = config["rag"]["similarity_threshold"]

    async def retrieve(
        self,
        query: str,
        top_k: Optional[int] = None,
        filter_by: Optional[Dict] = None,
    ) -> RetrievedContext:
        """Retrieve relevant context for a query"""

        top_k = top_k or self.top_k

        # Search vector store
        results = await self.vectorstore.search(
            query=query, top_k=top_k, filter_metadata=filter_by
        )

        # Filter by similarity threshold
        filtered_results = [
            r
            for r in results
            if r.get("relevance", 0) >= self.similarity_threshold
        ]

        return RetrievedContext(
            query=query, results=filtered_results, total_found=len(filtered_results)
        )

    async def retrieve_by_file_type(
        self, query: str, file_extension: str, top_k: Optional[int] = None
    ) -> RetrievedContext:
        """Retrieve context filtered by file type"""

        filter_metadata = {"extension": file_extension}
        return await self.retrieve(query, top_k, filter_by=filter_metadata)

    async def retrieve_similar_code(
        self, code_snippet: str, top_k: Optional[int] = None
    ) -> RetrievedContext:
        """Find similar code snippets"""

        filter_metadata = {"type": "file"}
        return await self.retrieve(code_snippet, top_k, filter_by=filter_metadata)

    def format_context_for_llm(self, context: RetrievedContext) -> str:
        """Format retrieved context for LLM consumption"""

        if not context.results:
            return "No relevant context found."

        parts = [f"Query: {context.query}\n", "Relevant Context:\n"]

        for i, result in enumerate(context.results, 1):
            content = result.get("content", "")
            metadata = result.get("metadata", {})
            relevance = result.get("relevance", 0)

            parts.append(f"\n[{i}] (relevance: {relevance:.2f})")

            if metadata.get("file"):
                parts.append(f"File: {metadata['file']}")

            # Truncate long content
            if len(content) > 500:
                content = content[:500] + "..."

            parts.append(f"{content}\n")

        return "\n".join(parts)
